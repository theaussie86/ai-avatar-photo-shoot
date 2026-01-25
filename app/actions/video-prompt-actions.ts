"use server"

import { VideoPromptGenerationConfig, VideoPromptGenerationSchema } from "@/lib/video-prompt-schemas";
import { VIDEO_PROMPT_SYSTEM_PROMPT } from "@/lib/video-prompts";
import { decrypt } from "@/lib/encryption";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";
import { redirect } from "next/navigation";

// Label mappings for German UI values
const cameraStyleLabels: Record<string, string> = {
  cinematic: "Cinematic",
  slow_motion: "Slow Motion",
  zoom_in: "Zoom-In",
  orbit: "Orbit",
  dolly: "Dolly",
  static: "Statisch"
};

const filmEffectLabels: Record<string, string> = {
  dramatic: "Dramatisch",
  soft: "Weich",
  golden_hour: "Golden Hour",
  noir: "Noir",
  dreamy: "Verträumt"
};

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

  // Decrypt the API Key
  const apiKey = decrypt(profile.gemini_api_key);
  if (!apiKey) {
    throw new Error("Failed to decrypt API key.");
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

  const recordId = pendingRecord.id;

  try {
    // 6. Fetch image from Supabase storage
    let imageBlob: Blob;

    if (image.url && image.url.startsWith('http')) {
      // Image is already publicly accessible, fetch via URL
      const response = await fetch(image.url);
      if (!response.ok) {
        throw new Error("Failed to fetch image from URL");
      }
      imageBlob = await response.blob();
    } else if (image.storage_path) {
      // Download from Supabase storage
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('generated_images')
        .download(image.storage_path);

      if (downloadError || !fileData) {
        console.error("[VideoPrompt] Failed to download image:", downloadError);
        throw new Error("Failed to retrieve image from storage");
      }

      imageBlob = fileData;
    } else {
      throw new Error("Image has no accessible URL or storage path");
    }

    // 7. Upload to Gemini Files API
    console.log(`[VideoPrompt ${config.imageId}] Uploading image to Gemini...`);

    const client = new GoogleGenAI({ apiKey });
    const mimeType = imageBlob.type || 'image/jpeg';

    const uploadResult: any = await client.files.upload({
      file: imageBlob,
      config: { mimeType }
    });

    const geminiFile = uploadResult.file || uploadResult;
    if (!geminiFile.uri) {
      throw new Error("Gemini upload failed: No URI returned");
    }

    console.log(`[VideoPrompt ${config.imageId}] Uploaded to Gemini: ${geminiFile.uri}`);

    // Wait for file to be processed
    let status = "PROCESSING";
    let attempts = 0;
    const maxAttempts = 10;

    while (status === "PROCESSING" && attempts < maxAttempts) {
      try {
        const resourceName = geminiFile.uri.includes("/files/")
          ? "files/" + geminiFile.uri.split("/files/")[1]
          : geminiFile.name;

        const fileStatus = await client.files.get({ name: resourceName });
        status = fileStatus.state || "FAILED";

        if (status === "PROCESSING") {
          console.log(`[VideoPrompt ${config.imageId}] File still processing, waiting 2s (Attempt ${attempts + 1}/${maxAttempts})...`);
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (statusError) {
        console.error(`[VideoPrompt ${config.imageId}] Failed to check file status:`, statusError);
        break;
      }
      attempts++;
    }

    if (status !== "ACTIVE") {
      console.warn(`[VideoPrompt ${config.imageId}] File is in state ${status} after ${attempts} attempts. Proceeding anyway...`);
    }

    // 8. Generate prompt using Gemini with VIDEO_PROMPT_SYSTEM_PROMPT
    console.log(`[VideoPrompt ${config.imageId}] Generating video prompt...`);

    // Build user message with German labels
    const userMessage = `
Analysiere dieses Bild und erstelle einen Video-Prompt.

${config.userInstruction ? `Anweisungen: ${config.userInstruction}` : ''}

Kamera-Stil: ${cameraStyleLabels[config.cameraStyle]}
${config.filmEffects.length > 0 ? `Film-Effekte: ${config.filmEffects.map(e => filmEffectLabels[e]).join(', ')}` : ''}
`.trim();

    const parts: any[] = [
      {
        fileData: {
          mimeType: mimeType,
          fileUri: geminiFile.uri
        }
      },
      { text: userMessage }
    ];

    const result: any = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: VIDEO_PROMPT_SYSTEM_PROMPT
      },
      contents: [{
        role: 'user',
        parts: parts
      }]
    });

    const candidate = result.candidates?.[0] || result.response?.candidates?.[0];
    const textPart = candidate?.content?.parts?.find((p: any) => p.text);

    if (!textPart || !textPart.text) {
      console.error(`[VideoPrompt ${config.imageId}] No text generated. FinishReason: ${candidate?.finishReason}`);
      throw new Error("No video prompt generated. FinishReason: " + candidate?.finishReason);
    }

    const generatedPrompt = textPart.text.trim();

    console.log(`[VideoPrompt ${config.imageId}] Generated prompt (${generatedPrompt.length} chars)`);

    // 9. Update record with generated prompt_text and status 'completed'
    const { error: updateError } = await supabase
      .from('video_prompts')
      .update({
        status: 'completed',
        prompt_text: generatedPrompt
      })
      .eq('id', recordId);

    if (updateError) {
      console.error("[VideoPrompt] Failed to update record to completed:", updateError);
      throw new Error("Failed to save generated prompt.");
    }

    // Cleanup Gemini file
    try {
      const resourceName = geminiFile.uri.includes("/files/")
        ? "files/" + geminiFile.uri.split("/files/")[1]
        : geminiFile.name;

      await client.files.delete({ name: resourceName });
      console.log(`[VideoPrompt ${config.imageId}] Cleaned up Gemini file`);
    } catch (cleanupError) {
      console.error(`[VideoPrompt ${config.imageId}] Failed to cleanup Gemini file:`, cleanupError);
      // Non-fatal, continue
    }

    return {
      success: true,
      videoPromptId: recordId,
      promptText: generatedPrompt
    };

  } catch (error: any) {
    // 10. Handle errors - update status to 'failed' with error_message
    console.error(`[VideoPrompt ${config.imageId}] Generation failed:`, error);

    const errorMessage = error.message || "Unknown error occurred";

    await supabase
      .from('video_prompts')
      .update({
        status: 'failed',
        error_message: errorMessage
      })
      .eq('id', recordId);

    throw error;
  }
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
