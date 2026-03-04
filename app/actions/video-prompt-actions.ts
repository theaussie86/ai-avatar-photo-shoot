"use server"

import { VideoPromptGenerationConfig, VideoPromptGenerationSchema } from "@/lib/video-prompt-schemas";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { tasks } from "@trigger.dev/sdk/v3";
import type { generateVideoPromptTask } from "@/src/trigger/generate-video-prompt";
import type { getAISuggestionsTask } from "@/src/trigger/get-ai-suggestions";

export async function generateVideoPromptAction(data: VideoPromptGenerationConfig) {
  // 1. Validate input
  const validationResult = VideoPromptGenerationSchema.safeParse(data);
  if (!validationResult.success) {
    throw new Error("Invalid input: " + validationResult.error.message);
  }

  const config = validationResult.data;

  // 2. Authenticate user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 3. Get API key from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('gemini_api_key')
    .eq('id', user.id)
    .single();

  if (!profile?.gemini_api_key) {
    throw new Error("No Gemini API Key found in settings. Please add one in the Settings menu.");
  }

  // 4. Verify image ownership by fetching image and checking user owns the collection
  const { data: image, error: imageError } = await supabase
    .from('images')
    .select('id, url, storage_path, collection_id, collections(user_id)')
    .eq('id', config.imageId)
    .single();

  if (imageError || !image) {
    throw new Error("Image not found or access denied.");
  }

  // Check collection ownership via RLS (collections relationship)
  const collectionUserID = (image.collections as any)?.user_id;
  if (collectionUserID !== user.id) {
    throw new Error("Access denied: You do not own this image.");
  }

  // 5. Create pending record in video_prompts table
  const { data: pendingRecord, error: insertError } = await supabase
    .from('video_prompts')
    .insert({
      image_id: config.imageId,
      status: 'pending',
      prompt_text: '',
      user_instruction: config.userInstruction || null,
      camera_style: config.cameraStyle,
      film_effects: config.filmEffects,
      model_name: 'gemini-2.5-flash'
    })
    .select()
    .single();

  if (insertError || !pendingRecord) {
    console.error("[VideoPrompt] Failed to create pending record:", insertError);
    throw new Error("Failed to create video prompt record.");
  }

  // 6. Trigger background job
  console.log(`[VideoPrompt] Triggering background job for ${pendingRecord.id}`);

  const handle = await tasks.trigger<typeof generateVideoPromptTask>(
    "generate-video-prompt",
    {
      videoPromptId: pendingRecord.id,
      imageId: config.imageId,
      userId: user.id,
      encryptedApiKey: profile.gemini_api_key,
      config,
      imageUrl: image.url || undefined,
      storagePath: image.storage_path || undefined,
    }
  );

  console.log(`[VideoPrompt] Triggered job: ${handle.id}`);

  return {
    success: true,
    videoPromptId: pendingRecord.id,
    runId: handle.id,
    // Return pending status - client should poll for completion
    status: 'pending',
  };
}

export async function getVideoPromptsForImageAction(imageId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch video prompts (RLS ensures user can only see their own)
  const { data: prompts, error } = await supabase
    .from('video_prompts')
    .select('*')
    .eq('image_id', imageId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error("Failed to fetch video prompts: " + error.message);
  }

  return prompts || [];
}

export async function getAISuggestionsForImageAction(imageId: string): Promise<string[]> {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    // 2. Get API key from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('gemini_api_key')
      .eq('id', user.id)
      .single();

    if (!profile?.gemini_api_key) {
      console.error("[AISuggestions] No Gemini API Key found");
      return [];
    }

    // 3. Verify image ownership by fetching image and checking user owns the collection
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select('id, url, storage_path, collection_id, collections(user_id)')
      .eq('id', imageId)
      .single();

    if (imageError || !image) {
      console.error("[AISuggestions] Image not found or access denied");
      return [];
    }

    // Check collection ownership via RLS (collections relationship)
    const collectionUserID = (image.collections as any)?.user_id;
    if (collectionUserID !== user.id) {
      console.error("[AISuggestions] Access denied: User does not own this image");
      return [];
    }

    // 4. Trigger background job and wait for result
    // Note: For AI suggestions, we use triggerAndWait since it's expected to be relatively fast
    // and the client expects a synchronous response
    console.log(`[AISuggestions] Triggering background job for ${imageId}`);

    const handle = await tasks.triggerAndWait<typeof getAISuggestionsTask>(
      "get-ai-suggestions",
      {
        imageId,
        userId: user.id,
        encryptedApiKey: profile.gemini_api_key,
        imageUrl: image.url || undefined,
        storagePath: image.storage_path || undefined,
      }
    );

    if (handle.ok && handle.output) {
      console.log(`[AISuggestions] Job completed successfully`);
      return handle.output.suggestions || [];
    } else {
      console.error("[AISuggestions] Job failed or returned no output");
      return [];
    }

  } catch (error: any) {
    // Log errors but don't throw - suggestions are non-critical
    console.error("[AISuggestions] Error generating suggestions:", error);
    return [];
  }
}
