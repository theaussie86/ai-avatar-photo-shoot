
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

export async function generateImagesAction(data: ImageGenerationConfig) {
  const validatedData = validateImageGenerationConfig(data);

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

  const genAI = new GoogleGenerativeAI(apiKey);

  console.log("Starting generation for collection:", collection.id);

  const generatedImages: string[] = [];

  try {
      const imagesToGenerate = validatedData.imageCount[0];
      
      // Get available poses for the selected shot type
      const availablePoses = POSES[validatedData.shotType] || POSES["full_body"];
      // Shuffle poses to get random ones
      const shuffledPoses = [...availablePoses].sort(() => 0.5 - Math.random());
      
      // Pre-fetch reference images once if they are the same for all (optimization)
      const referenceImageParts = await processReferenceImages(validatedData.referenceImages || []);

      for (let i = 0; i < imagesToGenerate; i++) {
        // 1. Select a unique pose
        const pose = selectPose(validatedData.shotType, i, shuffledPoses);
        
        console.log(`Generating image ${i + 1}/${imagesToGenerate}... using pose: "${pose}"`);
        
        // 2. Refine Prompt Individually
        const finalPrompt = await refinePrompt(genAI, validatedData, pose);
        console.log(`   ✨ Refined Prompt [${i+1}]:`, finalPrompt.substring(0, 100) + "...");

        // 3. Generate Image using Gemini 3
        console.log(`   🎨 Sending to Gemini 3...`);
        
        let base64Data: string;
        try {
            base64Data = await generateImage(genAI, finalPrompt, referenceImageParts, validatedData.aspectRatio);
        } catch (error: any) {
             console.error(`   ❌ Generation failed for image ${i+1}:`, error);
             throw error; 
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `${collection.id}/${crypto.randomUUID()}.png`;
        
        const publicUrl = await uploadGeneratedImage(
            supabase, 
            'generated_images', 
            fileName, 
            buffer
        );

        const { error: insertError } = await supabase
            .from('images')
            .insert({
                collection_id: collection.id,
                user_id: user.id,
                url: publicUrl,
                storage_path: fileName,
                status: 'completed',
                type: 'generated',
                prompt: finalPrompt 
            });

        if (insertError) {
             console.error(`Failed to insert image record for ${fileName}:`, insertError);
             // We continue to next image but log this critical error
             // Ideally we might want to cleanup the file we just uploaded?
             // For now just logging to ensure we know why it's missing
             throw new Error("Database insert failed: " + insertError.message);
        }
            
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
  } finally {
      // Cleanup temporary reference images if a session ID was provided
      if (validatedData.tempStorageId) {
          const tempPath = `${user.id}/temp_references/${validatedData.tempStorageId}`;
          console.log(`[Cleanup] Removing temp references at: ${tempPath}`);
          try {
              await deleteFolder(supabase, 'generated_images', tempPath);
          } catch (cleanupError) {
              console.error("Failed to cleanup temp storage:", cleanupError);
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
    await deleteFolder(supabase, 'generated_images', collectionId);

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
