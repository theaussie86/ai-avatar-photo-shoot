
"use server"

import { ImageGenerationConfig } from "@/lib/schemas";
import { 
  validateImageGenerationConfig, 
  processReferenceImages, 
  refinePrompt, 
  generateImage, 
  selectPose 
} from "@/lib/image-generation";
import { uploadGeneratedImage, deleteFolder } from "@/lib/storage";
import { POSES } from "@/lib/poses";
import { decrypt } from "@/lib/encryption";
import { createClient } from "@/lib/supabase/server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { redirect } from "next/navigation";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"; // For background tasks

export async function generateImagesAction(data: ImageGenerationConfig) {
  const validatedData = validateImageGenerationConfig(data);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();

  if (!user) {
      redirect("/login");
  }

  // 1. Get API Key from Profile
  const { data: profile } = await supabase
      .from('profiles')
      .select('gemini_api_key')
      .eq('id', user.id)
      .single();

  if (!profile?.gemini_api_key) {
      throw new Error("No Gemini API Key found in settings. Please add one in the Settings menu.");
  }
  
  // Decrypt the API Key
  const apiKey = decrypt(profile.gemini_api_key);
  if (!apiKey) {
      throw new Error("Failed to decrypt API key.");
  }

  // 2. Get or Create Collection Record
  let collection;

  if (data.collectionId) {
    // Verify ownership and existence
    const { data: existingCollection, error: fetchError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', data.collectionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingCollection) {
      throw new Error("Collection not found or access denied.");
    }
    
    // Update status to processing if not already
    await supabase
      .from('collections')
      .update({ status: 'processing' })
      .eq('id', existingCollection.id);

    collection = existingCollection;
  } else {
    // Create new
    const { data: newCollection, error: collectionError } = await supabase
      .from('collections')
      .insert({
          user_id: user.id,
          status: 'processing',
          quantity: validatedData.imageCount[0],
          prompt: validatedData.customPrompt,
          type: validatedData.shotType,
          name: validatedData.collectionName
      } as any)
      .select()
      .single();

    if (collectionError) {
        console.error("Collection error:", collectionError);
        throw new Error("Failed to start generation session.");
    }
    collection = newCollection;
  }

  /* 
   * UPDATED FLOW: 
   * 1. Create DB records with 'pending' status.
   * 2. Trigger Edge Function for each image (Fire-and-forget / Background).
   * 3. UI will poll for updates.
   */

  const genAI = new GoogleGenerativeAI(apiKey);

  console.log("Starting generation session for collection:", collection.id);

  try {
      const imagesToGenerate = validatedData.imageCount[0];
      
      // Get available poses for the selected shot type
      const availablePoses = POSES[validatedData.shotType] || POSES["full_body"];
      // Shuffle poses to get random ones
      const shuffledPoses = [...availablePoses].sort(() => 0.5 - Math.random());
      
      // Use Service Role Key for Backend-to-Backend trusted communication
      // For background tasks, we use the KEY directly in the task, so we don't need it here necessarily, 
      // but good to check if environment is set up.
      // const serviceRoleKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

      // if (!serviceRoleKey) {
      //    console.error("Missing SERVICE_ROLE_KEY! Background tasks will fail.");
      // }

      for (let i = 0; i < imagesToGenerate; i++) {
        // 1. Select a unique pose
        const pose = selectPose(validatedData.shotType, i, shuffledPoses);
        
        // 2. Refine Prompt (Client-side / Server Action side)
        const finalPrompt = await refinePrompt(genAI, validatedData, pose);
        
        // 3. Create Placeholder in DB with FULL METADATA
        const { data: imageRecord, error: insertError } = await supabase
            .from('images')
            .insert({
                collection_id: collection.id,
                user_id: user.id,
                status: 'pending',
                type: 'generated',
                storage_path: 'pending',
                url: '',
                // Store all generation params in metadata so we can debug/retry if needed
                metadata: {
                    prompt: finalPrompt,
                    pose: pose,
                    config: validatedData, 
                }
            })
            .select()
            .single();

        if (insertError) {
             console.error(`Failed to insert pending image record:`, insertError);
             // We continue to next image but log this one failed to start
             continue; 
        }

        // 4. Trigger Async Generation Task (Fire & Forget)
        // We do NOT await this. It runs in the background.
        console.log(`[Action] Triggering Async Task for Image ${imageRecord.id}`);
        // Pass session tokens if available
        const accessToken = session?.access_token;
        const refreshToken = session?.refresh_token;

        generateImageTask(imageRecord.id, apiKey, finalPrompt, validatedData, accessToken, refreshToken).catch(async (err) => {
            console.error(`Unhandled error in background task for ${imageRecord.id}:`, err);
            // Last resort safety net: try to mark as failed if the task function itself crashed before handling it
            try {
                 const safetySupabase = createClient(); // New client for safety update
                 await (await safetySupabase).from('images').update({ status: 'failed' }).eq('id', imageRecord.id);
            } catch (e) {
                console.error("Failed to update status in safety catch:", e);
            }
        });
        
      }

      return {
          success: true,
          collectionId: collection.id,
          images: [], // UI will fetch them via polling
      };

  } catch (error: any) {
      console.error("Generation process failed:", error);
       // If the collection setup failed, we mark the collection as failed
       if (collection?.id) {
           await supabase
              .from('collections')
              .update({ status: 'failed' })
              .eq('id', collection.id);
       }
      throw error;
  }
}

// Internal Background Task (Exported for testing)
export async function generateImageTask(
    imageId: string, 
    apiKey: string, 
    prompt: string, 
    config: ImageGenerationConfig,
    accessToken?: string,
    refreshToken?: string
) {
    console.log(`[Task ${imageId}] Starting generation...`);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
    
    // Create Client for background operations
    const supabase = createSupabaseAdmin(supabaseUrl, supabaseKey, {
        auth: { 
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });

    if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
        });
         if (sessionError) console.error(`[Task ${imageId}] Session Error:`, sessionError);
    } 

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const referenceImageUrls = config.referenceImages || [];

        // Verify DB Access immediately
        const { data: checkImg, error: checkError } = await supabase.from('images').select('id, user_id').eq('id', imageId).single();
        if (checkError) throw new Error(`Initial DB check failed: ${checkError.message}`);
        
        console.log(`[Task ${imageId}] Initial DB Check OK. User/Owner match: ${checkImg.user_id}`);

        // 1. Prepare Reference Images
        const parts: any[] = [{ text: prompt }];
        
        if (referenceImageUrls.length > 0) {
           console.log(`[Task ${imageId}] Fetching ${referenceImageUrls.length} references`);
           try {
               const imagePromises = referenceImageUrls.map(async (url) => {
                  const response = await fetch(url);
                  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
                  const arrayBuffer = await response.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);
                  return {
                      inlineData: {
                          data: buffer.toString('base64'),
                          mimeType: response.headers.get('content-type') || 'image/jpeg'
                      }
                  };
               });
               
               const loadedImages = await Promise.all(imagePromises);
               parts.push(...loadedImages);
           } catch (refError) {
               console.error(`[Task ${imageId}] Reference image loading failed:`, refError);
               // Depends on policy: fail whole generation or continue without ref?
               // Let's fail to be safe and clear.
               throw new Error("Failed to load reference images.");
           }
        }

        // 2. Generate
        console.log(`[Task ${imageId}] Calling Gemini...`);
        const modelName = config.model || "models/gemini-2.0-flash";
        // REMINDER: gemini-1.5-flash does not support image generation natively via this specific method usually, 
        // but let's assume the user has a model that works or is using the right one.
        // The user previously mentioned `gemini-3-pro-image-preview` or similar? 
        // Let's stick to what was there or the config.
        
        console.log(`[Task ${imageId}] Calling Gemini Model: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ model: modelName }); 
        
        let generationConfig: any = {
             responseModalities: ["IMAGE"],
             imageConfig: {}
        };

        if (config.aspectRatio && config.aspectRatio !== 'Auto') {
             generationConfig.imageConfig.aspectRatio = config.aspectRatio;
        }

        const result = await model.generateContent({
             contents: [{ role: 'user', parts: parts }],
             generationConfig: generationConfig
        });

        const candidate = result.response.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData);

        if (!imagePart || !imagePart.inlineData) {
             console.error(`[Task ${imageId}] No image. FinishReason: ${candidate?.finishReason}`);
             throw new Error("No image generated. FinishReason: " + candidate?.finishReason);
        }

        const base64Data = imagePart.inlineData.data;
        const buffer = Buffer.from(base64Data, 'base64');

        // 3. Upload
        console.log(`[Task ${imageId}] Uploading...`);
        const { data: img } = await supabase.from('images').select('collection_id').eq('id', imageId).single();
        const collectionId = img?.collection_id || 'unknown';
        
        const storagePath = `${collectionId}/${crypto.randomUUID()}.png`;

        const { error: uploadError } = await supabase.storage
            .from('generated_images')
            .upload(storagePath, buffer, { contentType: 'image/png' });

        if (uploadError) throw new Error("Upload failed: " + uploadError.message);

        const { data: { publicUrl } } = supabase.storage
            .from('generated_images')
            .getPublicUrl(storagePath);

        // 4. Update DB
        console.log(`[Task ${imageId}] Done! Updating DB...`);
        const { error: updateError } = await supabase.from('images').update({
            status: 'completed',
            url: publicUrl,
            storage_path: storagePath
        }).eq('id', imageId);

        if (updateError) throw new Error("DB Update failed: " + updateError.message);

        console.log(`[Task ${imageId}] Success.`);

    } catch (err: any) {
        console.error(`[Task ${imageId}] FAILED:`, err);
        
        // CRITICAL: Update status to 'failed' so polling stops
        const { error: failUpdateError } = await supabase.from('images').update({
            status: 'failed',
            // We could store error message if we had a column for it
        }).eq('id', imageId);

        if (failUpdateError) {
             console.error(`[Task ${imageId}] Double Fault: Failed to update status to failed!`, failUpdateError);
        }
    }

}

export async function deleteCollectionAction(collectionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Verify ownership
    const { data: collection } = await supabase
        .from('collections')
        .select('id')
        .eq('id', collectionId)
        .eq('user_id', user.id)
        .single();

    if (!collection) {
        throw new Error("Collection not found or access denied");
    }

    // 1. Aggressive Storage Cleanup via Helper
    console.log(`[Delete] Deleting folder logic for: ${collectionId}`);
    await deleteFolder(supabase, 'generated_images', collectionId);

    // 2. Delete DB Records
    // Cascade delete should handle images if set up, but we manually delete to be sure
    await supabase.from('images').delete().eq('collection_id', collectionId);

    const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId)
        .eq('user_id', user.id);

    if (error) {
        throw new Error("Failed to delete collection: " + error.message);
    }
    

    return { success: true };
}

export async function deleteImageAction(imageId: string, storagePath: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
      throw new Error("Unauthorized");
  }

  // 1. Verify Ownership
  const { data: image } = await supabase
      .from('images')
      .select('id, user_id')
      .eq('id', imageId)
      .eq('user_id', user.id)
      .single();

  if (!image) {
      throw new Error("Image not found or access denied");
  }

  // 2. Delete from Storage
  // We don't throw if it fails, just log it, identifying that cleaning up the DB is priority
  if (storagePath && storagePath !== 'pending') {
      const { error: storageError } = await supabase
          .storage
          .from('generated_images')
          .remove([storagePath]);
      
      if (storageError) {
          console.error("Failed to remove file from storage:", storageError);
      }
  }

  // 3. Delete from DB
  const { error: dbError } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId);

  if (dbError) {
      throw new Error("Failed to delete image record: " + dbError.message);
  }

  return { success: true };
}

export async function deleteCollectionImagesAction(collectionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // 1. Verify Ownership
    const { data: collection } = await supabase
        .from('collections')
        .select('id')
        .eq('id', collectionId)
        .eq('user_id', user.id)
        .single();

    if (!collection) {
        throw new Error("Collection not found or access denied");
    }

    // 2. Delete from Storage
    await deleteFolder(supabase, 'generated_images', collectionId);

    // 3. Delete from DB
    const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('collection_id', collectionId);

    if (dbError) {
        throw new Error("Failed to delete images: " + dbError.message);
    }

    return { success: true };
}

export async function retriggerImageAction(imageId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // 1. Fetch Image & Verify Ownership
    const { data: image } = await supabase
        .from('images')
        .select('*')
        .eq('id', imageId)
        .eq('user_id', user.id)
        .single();

    if (!image) {
        throw new Error("Image not found");
    }

    // 2. Get API Key (re-fetch needed as we are in a new action scope)
    const { data: profile } = await supabase
        .from('profiles')
        .select('gemini_api_key')
        .eq('id', user.id)
        .single();
    
    if (!profile?.gemini_api_key) throw new Error("API Key not found");
    const apiKey = decrypt(profile.gemini_api_key);
    if (!apiKey) throw new Error("Failed to decrypt API key");

    // 3. Reset Status
    await supabase.from('images').update({ 
        status: 'pending',
        storage_path: 'pending' 
    }).eq('id', imageId);

    // 4. Trigger Async Task
    // Extract metadata
    const meta = image.metadata as any;
    if (!meta || !meta.prompt || !meta.config) {
        throw new Error("Cannot retrigger: Missing generation metadata.");
    }
    
    console.log(`[Retrigger] Restarting task for ${imageId}`);
    // Retriggering might fail RLS if we don't pass session, but retriggerImageAction (Server Action) 
    // has access to cookies, but we need to extract tokens.
    const { data: { session } } = await supabase.auth.getSession();
    generateImageTask(imageId, apiKey, meta.prompt, meta.config, session?.access_token, session?.refresh_token).catch(console.error);

    return { success: true };
}

export async function getImageAction(imageId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: image, error } = await supabase
        .from('images')
        .select('*')
        .eq('id', imageId)
        .eq('user_id', user.id)
        .single();
    
    if (error) throw new Error(error.message);
    return image;
}

export async function getCollectionImagesAction(collectionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: images, error } = await supabase
        .from('images')
        .select('*')
        .eq('collection_id', collectionId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return images;
}
