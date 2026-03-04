
"use server"

import { ImageGenerationConfig } from "@/lib/schemas";
import {
  validateImageGenerationConfig,
  refinePrompt,
  selectPose
} from "@/lib/image-generation";
import { POSES } from "@/lib/poses";
import { decrypt } from "@/lib/encryption";
import { createClient } from "@/lib/supabase/server";

import { GoogleGenAI } from "@google/genai";
import { redirect } from "next/navigation";
import { tasks } from "@trigger.dev/sdk/v3";
import type { generateImageTask } from "@/src/trigger/generate-image";
import type { deleteCollectionTask } from "@/src/trigger/delete-collection";
import type { deleteCollectionImagesTask } from "@/src/trigger/delete-collection-images";


// Image Generation Action - Creates pending records and triggers background jobs
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

  // Store the encrypted key (for passing to Trigger.dev tasks)
  const encryptedApiKey = profile.gemini_api_key;

  // Decrypt the API Key for reference image processing
  const apiKey = decrypt(encryptedApiKey);
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

  console.log("Starting generation session for collection:", collection.id);

  try {
      const imagesToGenerate = validatedData.imageCount[0];

      // Get available poses for the selected shot type
      const availablePoses = POSES[validatedData.shotType] || POSES["full_body"];
      // Shuffle poses to get random ones
      const shuffledPoses = [...availablePoses].sort(() => 0.5 - Math.random());

      // Phase 1: Create DB Records & Refine Prompts in Parallel
      const imageRecords: Array<{
          imageId: string;
          prompt: string;
          config: ImageGenerationConfig;
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

            imageRecords.push({
                imageId: imageRecord.id,
                prompt: finalPrompt,
                config: validatedData,
            });

        } catch (err) {
            console.error(`Error preparing image ${i}:`, err);
        }
      }));

      // Phase 2: Trigger background jobs via Trigger.dev
      console.log(`[Action] Triggering ${imageRecords.length} background jobs...`);

      const triggerPromises = imageRecords.map(async (record) => {
        const handle = await tasks.trigger<typeof generateImageTask>(
          "generate-image",
          {
            imageId: record.imageId,
            userId: user.id,
            encryptedApiKey: encryptedApiKey,
            prompt: record.prompt,
            config: record.config,
          }
        );
        return { imageId: record.imageId, runId: handle.id };
      });

      const handles = await Promise.all(triggerPromises);
      console.log(`[Action] Triggered ${handles.length} jobs successfully.`);

      return {
          success: true,
          collectionId: collection.id,
          imageIds: handles.map(h => h.imageId),
          runIds: handles.map(h => h.runId),
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

    // Trigger background job for deletion
    console.log(`[Delete] Triggering background deletion for collection: ${collectionId}`);

    const handle = await tasks.trigger<typeof deleteCollectionTask>(
      "delete-collection",
      {
        collectionId,
        userId: user.id,
      }
    );

    console.log(`[Delete] Triggered job: ${handle.id}`);

    return { success: true, runId: handle.id };
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

  // Delete Main Image from Storage (non-blocking)
  if (storagePath && storagePath !== 'pending') {
      const { error: storageError } = await supabase
          .storage
          .from('generated_images')
          .remove([storagePath]);

      if (storageError) {
          console.error("Failed to remove file from storage:", storageError);
      }
  }

  // Delete from DB
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

    // Verify Ownership
    const { data: collection } = await supabase
        .from('collections')
        .select('id')
        .eq('id', collectionId)
        .eq('user_id', user.id)
        .single();

    if (!collection) {
        throw new Error("Collection not found or access denied");
    }

    // Trigger background job for deletion
    console.log(`[Delete] Triggering background deletion for collection images: ${collectionId}`);

    const handle = await tasks.trigger<typeof deleteCollectionImagesTask>(
      "delete-collection-images",
      {
        collectionId,
        userId: user.id,
      }
    );

    console.log(`[Delete] Triggered job: ${handle.id}`);

    return { success: true, runId: handle.id };
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

    // 2. Get API Key
    const { data: profile } = await supabase
        .from('profiles')
        .select('gemini_api_key')
        .eq('id', user.id)
        .single();

    if (!profile?.gemini_api_key) throw new Error("API Key not found");

    // 3. Reset Status
    await supabase.from('images').update({
        status: 'pending',
        storage_path: 'pending'
    }).eq('id', imageId);

    // 4. Extract metadata
    const meta = image.metadata as any;
    if (!meta || !meta.prompt || !meta.config) {
        throw new Error("Cannot retrigger: Missing generation metadata.");
    }

    // 5. Trigger background job
    console.log(`[Retrigger] Triggering background job for ${imageId}`);

    const handle = await tasks.trigger<typeof generateImageTask>(
      "generate-image",
      {
        imageId,
        userId: user.id,
        encryptedApiKey: profile.gemini_api_key,
        prompt: meta.prompt,
        config: meta.config,
      }
    );

    console.log(`[Retrigger] Triggered job: ${handle.id}`);

    return { success: true, runId: handle.id };
}

// DEPRECATED: No longer needed - jobs are triggered automatically
// Kept for backwards compatibility during migration
export async function triggerImageGenerationAction(imageId: string) {
    console.warn("[DEPRECATED] triggerImageGenerationAction is no longer needed. Jobs are triggered automatically.");

    // Just return success - the job should already be running
    return { success: true, status: 'triggered' };
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
