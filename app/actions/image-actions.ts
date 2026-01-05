
"use server"

import { ImageGenerationConfig, ImageGenerationSchema } from "@/lib/schemas";
import { IMAGE_GENERATION_SYSTEM_PROMPT } from "@/lib/prompts";
import { POSES } from "@/lib/poses";
import { createClient } from "@/lib/supabase/server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { redirect } from "next/navigation";

export async function generateImagesAction(data: ImageGenerationConfig) {
  const result = ImageGenerationSchema.safeParse(data);

  if (!result.success) {
      throw new Error("Validation failed: " + result.error.message);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
          quantity: data.imageCount[0],
          prompt: data.customPrompt,
          type: data.shotType,
          name: data.collectionName
      } as any)
      .select()
      .single();

    if (collectionError) {
        console.error("Collection error:", collectionError);
        throw new Error("Failed to start generation session.");
    }
    collection = newCollection;
  }

  const genAI = new GoogleGenerativeAI(profile.gemini_api_key);

  // 1. Refinement moved inside loop for per-image variation
  console.log("Starting generation for collection:", collection.id);

  const generatedImages: string[] = [];

  try {
      const imagesToGenerate = data.imageCount[0];
      
      // Get available poses for the selected shot type
      const availablePoses = POSES[data.shotType] || POSES["full_body"];
      // Shuffle poses to get random ones
      const shuffledPoses = [...availablePoses].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < imagesToGenerate; i++) {
        // 1. Select a unique pose
        // If we request more images than poses, we cycle through them
        const pose = shuffledPoses[i % shuffledPoses.length];
        
        console.log(`Generating image ${i + 1}/${imagesToGenerate}... using pose: "${pose}"`);
        
        // 2. Refine Prompt Individually
        let finalPrompt = data.customPrompt || "A professional photo of an AI avatar";
        
        try {
            const textModel = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                systemInstruction: IMAGE_GENERATION_SYSTEM_PROMPT
            });

            const promptRequest = `Generate a photography prompt for:
              Aspect Ratio: ${data.aspectRatio}
              Shot Type: ${data.shotType}
              Pose: ${pose}
              Background: ${data.background}
              Custom Instructions: ${data.customPrompt || "None"}
            `;

            const { response } = await textModel.generateContent(promptRequest);
            const refined = response.text();
            
            if (refined) {
                finalPrompt = refined;
                console.log(`   ✨ Refined Prompt [${i+1}]:`, finalPrompt.substring(0, 100) + "...");
            }
        } catch (promptError) {
             console.error("Prompt refinement failed, using fallback:", promptError);
             finalPrompt = `${data.shotType} photo, pose: ${pose}, ${data.background} background. ${data.customPrompt || ""}`;
        }

        // 3. Generate Image (Simulated/Placeholder)
        // Simulating 2s delay
        await new Promise(r => setTimeout(r, 1000));
        
        const buffer = await fetch(`https://picsum.photos/seed/${collection.id}-${i}-${pose.length}/1024/1024`)
            .then(res => res.arrayBuffer());

        const fileName = `${collection.id}/${crypto.randomUUID()}.png`;
        
        const { error: uploadError } = await supabase
            .storage
            .from('generated_images')
            .upload(fileName, buffer, {
                contentType: 'image/png'
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            continue; 
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from('generated_images')
            .getPublicUrl(fileName);

        await supabase
            .from('images')
            .insert({
                collection_id: collection.id,
                user_id: user.id,
                url: publicUrl,
                storage_path: fileName,
                status: 'completed',
                type: 'generated',
                prompt: finalPrompt // Useful to save the prompt!
            });
            
        generatedImages.push(publicUrl);
      }

      // Update Collection
      await supabase
          .from('collections')
          .update({ status: 'completed' })
          .eq('id', collection.id);
          
      return {
          success: true,
          collectionId: collection.id,
          images: generatedImages
      };

  } catch (error: any) {
      console.error("Generation process failed:", error);
       await supabase
          .from('collections')
          .update({ status: 'failed' })
          .eq('id', collection.id);
      throw error;
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

    // 1. Aggressive Storage Cleanup
    // We list all files in the collection folder and delete them.
    // This is safer than relying on DB records which might be out of sync.
    try {
        console.log(`[Delete] Attempting to list files in folder: ${collectionId}`);
        const { data: files, error: listError } = await supabase
            .storage
            .from('generated_images')
            .list(collectionId);

        if (listError) {
            console.error("[Delete] Storage list error:", listError);
        } else {
            console.log(`[Delete] Found ${files?.length || 0} files in storage folder`);
            if (files && files.length > 0) {
                 files.forEach(f => console.log(`   - Found file: ${f.name}`));
            }
        }

        if (files && files.length > 0) {
            // Robust path handling:
            // 1. Use the name as is.
            // 2. Also try decoded name if different (e.g. invalid url encoding in storage vs db)
            // 3. NO leading slash.
            
            const pathsToDelete: string[] = [];
            files.forEach(f => {
                const rawPath = `${collectionId}/${f.name}`;
                pathsToDelete.push(rawPath);
                
                // If name looks encoded, try adding the decoded version too just in case
                try {
                    const decodedName = decodeURIComponent(f.name);
                    if (decodedName !== f.name) {
                        pathsToDelete.push(`${collectionId}/${decodedName}`);
                    }
                } catch (e) {
                    // ignore decoding errors
                }
            });

            console.log(`[Delete] Deleting ${pathsToDelete.length} paths (may include duplicates/variants):`, pathsToDelete);
            
            const { error: removeError } = await supabase
                .storage
                .from('generated_images')
                .remove(pathsToDelete);

            if (removeError) {
                console.error("[Delete] Storage remove error:", removeError);
            } else {
                console.log("[Delete] Storage remove successful");
            }
        } else {
            console.log("[Delete] No files found in storage for deletion.");
        }
    } catch (err) {
        console.error("[Delete] Unexpected error during storage cleanup:", err);
        // Continue to DB deletion even if storage cleanup fails/throws
    }

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
  if (storagePath) {
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
    // List all files in the collection folder
    const { data: files } = await supabase
        .storage
        .from('generated_images')
        .list(collectionId);

    if (files && files.length > 0) {
        const pathsToDelete = files.map(f => `${collectionId}/${f.name}`);
        await supabase
            .storage
            .from('generated_images')
            .remove(pathsToDelete);
    }

    // 3. Delete from DB
    const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('collection_id', collectionId);

    if (dbError) {
        throw new Error("Failed to delete images: " + dbError.message);
    }

    // Update collection status back to initial or similar if needed? 
    // Maybe not necessary as we can just add new images.
    
    return { success: true };
}
