
"use server"

import { ImageGenerationConfig } from "@/lib/schemas";
import { 
  validateImageGenerationConfig, 
  refinePrompt, 
  selectPose 
} from "@/lib/image-generation";
import { deleteFolder } from "@/lib/storage";
import { POSES } from "@/lib/poses";
import { decrypt } from "@/lib/encryption";
import { createClient } from "@/lib/supabase/server";

import { GoogleGenAI } from "@google/genai";
import { redirect } from "next/navigation";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"; // For background tasks


// NEW: Direct Upload Action
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
  
  // 1.5. Process Reference Images (Supabase -> Gemini)
  // This bypasses the Vercel 4.5MB limit by having the client upload to Supabase, 
  // and the server transferring it to Gemini.
  const processedReferenceImages: string[] = [];
  const client = new GoogleGenAI({ apiKey: apiKey });

  if (validatedData.referenceImages && validatedData.referenceImages.length > 0) {
      console.log(`[Action] Processing ${validatedData.referenceImages.length} reference images...`);
      
      for (const ref of validatedData.referenceImages) {
          if (ref.startsWith('uploaded_images/')) {
              console.log(`[Action] Transferring ${ref} from Supabase to Gemini...`);
              
              // 1. Download from Supabase
              const { data: fileData, error: downloadError } = await supabase
                  .storage
                  .from('uploaded_images')
                  .download(ref.replace('uploaded_images/', ''));

              if (downloadError || !fileData) {
                  console.error(`Failed to download ${ref}:`, downloadError);
                  throw new Error(`Failed to retrieve uploaded image: ${ref}`);
              }

              // 2. Upload to Gemini
              const arrayBuffer = await fileData.arrayBuffer();
              const mimeType = fileData.type || 'image/jpeg';
              
              // Create a Blob from the array buffer (Node 18+ supports global Blob)
              const fileBlob = new Blob([arrayBuffer], { type: mimeType });

              const uploadResult: any = await client.files.upload({
                  file: fileBlob, 
                  config: { mimeType } 
              }).catch(async (e) => {
                  console.warn("Direct upload failed:", e);
                  throw e;
              });
              
              const geminiFile = uploadResult.file || uploadResult;
              if (!geminiFile.uri) throw new Error("Gemini upload failed: No URI returned");
              
              console.log(`[Action] Transferred to Gemini: ${geminiFile.uri}`);
              processedReferenceImages.push(geminiFile.uri);

              // 3. Cleanup Supabase Storage
              await supabase.storage
                  .from('uploaded_images')
                  .remove([ref.replace('uploaded_images/', '')]);

          } else {
              processedReferenceImages.push(ref);
          }
      }
      // Update config with Gemini URIs
      validatedData.referenceImages = processedReferenceImages;
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

  // const client = new GoogleGenAI({ apiKey: apiKey }); // Already created above

  console.log("Starting generation session for collection:", collection.id);

  try {
      const imagesToGenerate = validatedData.imageCount[0];
      
      // Get available poses for the selected shot type
      const availablePoses = POSES[validatedData.shotType] || POSES["full_body"];
      // Shuffle poses to get random ones
      const shuffledPoses = [...availablePoses].sort(() => 0.5 - Math.random());

      // Phase 1: Create DB Records & Refine Prompts in Parallel
      const tasksToTrigger: Array<{
          imageId: string; 
          apiKey: string; 
          prompt: string; 
          config: ImageGenerationConfig;
          accessToken?: string;
          refreshToken?: string;
      }> = [];

      await Promise.all(Array.from({ length: imagesToGenerate }).map(async (_, i) => {
        try {
            // Select a unique pose
            const pose = selectPose(validatedData.shotType, i, shuffledPoses);
            
            // Refine Prompt
            const finalPrompt = await refinePrompt(client, validatedData, pose);
            
            // Create Placeholder in DB
            const { data: imageRecord, error: insertError } = await supabase
                .from('images')
                .insert({
                    collection_id: collection.id,
                    status: 'pending',
                    type: 'generated',
                    storage_path: 'pending',
                    url: '',
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
                return;
            }

            // Queue for Phase 2
            tasksToTrigger.push({
                imageId: imageRecord.id,
                apiKey,
                prompt: finalPrompt,
                config: validatedData,
                accessToken: session?.access_token,
                refreshToken: session?.refresh_token
            });

        } catch (err) {
            console.error(`Error preparing image ${i}:`, err);
        }
      }));

      return {
          success: true,
          collectionId: collection.id,
          imageIds: tasksToTrigger.map(t => t.imageId),
          images: [], 
      };

  } catch (error: any) {
      console.error("Generation process failed:", error);
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

    const uploadedFiles: { name: string, uri: string }[] = [];
    const client = new GoogleGenAI({ apiKey });

    let generationSuccess = false;
    try {
        const referenceImageUris = config.referenceImages || [];

        // Verify DB Access immediately (RLS ensures ownership via collection)
        const { data: checkImg, error: checkError } = await supabase.from('images').select('id').eq('id', imageId).single();
        if (checkError) throw new Error(`Initial DB check failed: ${checkError.message}`);

        console.log(`[Task ${imageId}] Initial DB Check OK. RLS verified access.`);

        // 1. Prepare Reference Images using ALREADY UPLOADED Gemini Files
        const parts: any[] = [];
        let explicitRefInstruction = "";
        
        if (referenceImageUris.length > 0) {
           console.log(`[Task ${imageId}] Using ${referenceImageUris.length} pre-uploaded Gemini references`);
           explicitRefInstruction = " Use the attached reference image(s) to preserve the subject's identity, facial features, and likeness in the generated image.";
           
            for (const uri of referenceImageUris) {
               const fileUri = uri;
               
               // Extract name properly.
               let resourceName = "";
               if (fileUri.includes("/files/")) {
                   resourceName =  "files/" + fileUri.split("/files/")[1];
               }
               
               let detectedMimeType = "image/jpeg"; // Fallback
               
               if (resourceName) {
                    uploadedFiles.push({ name: resourceName, uri: fileUri });
                    
                    // Just-in-time status check
                    console.log(`[Task ${imageId}] Checking processing status for ${resourceName}...`);
                    let status = "PROCESSING";
                    let attempts = 0;
                    const maxAttempts = 10;
                    
                    while (status === "PROCESSING" && attempts < maxAttempts) {
                        try {
                            const fileStatus = await client.files.get({ name: resourceName });
                            status = fileStatus.state || "FAILED";
                            if (fileStatus.mimeType) {
                                detectedMimeType = fileStatus.mimeType;
                            }
                            if (status === "PROCESSING") {
                                console.log(`[Task ${imageId}] Still processing ${resourceName}, waiting 2s (Attempt ${attempts + 1}/${maxAttempts})...`);
                                await new Promise(r => setTimeout(r, 2000));
                            }
                        } catch (statusError) {
                            console.error(`[Task ${imageId}] Failed to check status for ${resourceName}:`, statusError);
                            break; 
                        }
                        attempts++;
                    }

                    if (status !== "ACTIVE") {
                        console.warn(`[Task ${imageId}] File ${resourceName} is in state ${status} after ${attempts} attempts.`);
                    }
               }

               parts.push({ 
                   fileData: { 
                       mimeType: detectedMimeType, 
                       fileUri: fileUri 
                   } 
               });
           }
        }

        // Add the prompt text part LAST (usually good practice to have context then prompt, or vice versa)
        parts.unshift({ text: prompt + explicitRefInstruction });

        // 2. Generate
        let modelName = config.model || "gemini-2.5-flash-image"; 
        
        console.log(`[Task ${imageId}] Calling Gemini Model: ${modelName}`);
        
        const generateConfig: any = {
            responseModalities: ["IMAGE"]
        };

        if (config.aspectRatio && config.aspectRatio !== 'Auto') {
             generateConfig.imageConfig = {
                 aspectRatio: config.aspectRatio
             };
        }

        const result: any = await client.models.generateContent({
             model: modelName,
             contents: [{ role: 'user', parts: parts }],
             config: generateConfig
        });

        const candidate = result.candidates?.[0] || result.response?.candidates?.[0];
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

        generationSuccess = true;
        console.log(`[Task ${imageId}] Success.`);

    } catch (err: any) {
        console.error(`[Task ${imageId}] FAILED:`, err);
        
        // Detailed error logging for API errors
        if (err.response) {
            console.error(`[Task ${imageId}] API Error Response:`, JSON.stringify(err.response, null, 2));
        }
        if (err.body) {
             console.error(`[Task ${imageId}] API Error Body:`, JSON.stringify(err.body, null, 2));
        }

        // CRITICAL: Update status to 'failed' so polling stops
        const { error: failUpdateError } = await supabase.from('images').update({
            status: 'failed',
            // We could store error message if we had a column for it
        }).eq('id', imageId);

        if (failUpdateError) {
             console.error(`[Task ${imageId}] Double Fault: Failed to update status to failed!`, failUpdateError);
        }
    } finally {
        // Refined Cleanup Gemini Files
        // Don't delete if other pending or failed images still need these references
        if (uploadedFiles.length > 0) {
            try {
                // 1. Fetch all other pending or failed images to see what's still needed
                const { data: activeImages, error: fetchError } = await supabase
                    .from('images')
                    .select('metadata')
                    .in('status', ['pending', 'failed']);

                if (fetchError) {
                    console.error(`[Task ${imageId}] Failed to fetch active images for cleanup check:`, fetchError);
                } else {
                    const allNeededUris = new Set<string>();
                    activeImages?.forEach(img => {
                        const config = (img.metadata as any)?.config;
                        config?.referenceImages?.forEach((uri: string) => allNeededUris.add(uri));
                    });

                    // 2. Delete only URIs that are NOT in allNeededUris
                    console.log(`[Task ${imageId}] Checking cleanup for ${uploadedFiles.length} Gemini files...`);
                    for (const file of uploadedFiles) {
                        if (!allNeededUris.has(file.uri)) {
                            console.log(`[Task ${imageId}] URI ${file.uri} no longer needed (no pending or failed tasks). Cleaning up...`);
                            await client.files.delete({ name: file.name }).catch(cleanupError => {
                                console.error(`[Task ${imageId}] Failed to delete Gemini file ${file.name}:`, cleanupError);
                            });
                        } else {
                            console.log(`[Task ${imageId}] URI ${file.uri} still needed by other tasks. Skipping cleanup.`);
                        }
                    }
                }
            } catch (err) {
                console.error(`[Task ${imageId}] Error during granular cleanup:`, err);
            }
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

  // 1. Verify Ownership & Get Metadata (RLS enforces ownership via collection)
  const { data: image } = await supabase
      .from('images')
      .select('id, collection_id, metadata')
      .eq('id', imageId)
      .single();

  if (!image) {
      throw new Error("Image not found or access denied");
  }

  // 3. Cleanup Gemini Files (Skipped per user request)
  // User requested to not delete files from Gemini API when deleting an image.


  // 4. Delete Main Image from Storage
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

  // 4. Delete from DB
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

    // 1. Fetch Image (RLS enforces ownership via collection)
    const { data: image } = await supabase
        .from('images')
        .select('*')
        .eq('id', imageId)
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

export async function triggerImageGenerationAction(imageId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // 1. Fetch Image (RLS enforces ownership via collection)
    const { data: image } = await supabase
        .from('images')
        .select('*')
        .eq('id', imageId)
        .single();

    if (!image) throw new Error("Image not found");

    // If already completed, skip
    if (image.status === 'completed') {
        return { success: true, status: 'completed' };
    }

    // 2. Get API Key from Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('gemini_api_key')
        .eq('id', user.id)
        .single();

    if (!profile?.gemini_api_key) throw new Error("API Key not found");
    const apiKey = decrypt(profile.gemini_api_key);
    if (!apiKey) throw new Error("Failed to decrypt API key");

    // 3. Trigger Generation (AWAITED for client connection persistence)
    const meta = image.metadata as any;
    if (!meta || !meta.prompt || !meta.config) {
         // Mark as failed if we can't generate
         await supabase.from('images').update({ status: 'failed' }).eq('id', imageId);
         throw new Error("Missing metadata");
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    // We await this now!
    await generateImageTask(
        imageId, 
        apiKey, 
        meta.prompt, 
        meta.config, 
        session?.access_token, 
        session?.refresh_token
    );

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
        .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return images;
}
