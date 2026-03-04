import { schemaTask, logger } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseAdmin, verifyImageOwnership } from "./utils/supabase-admin";
import { extractResourceName, waitForFileActive, cleanupGeminiFile, uploadToGemini } from "./utils/gemini-helpers";
import { decrypt } from "@/lib/encryption";
import { VIDEO_PROMPT_SYSTEM_PROMPT } from "@/lib/video-prompts";
import { VideoPromptGenerationSchema } from "@/lib/video-prompt-schemas";

// Label mappings for German UI values
const cameraStyleLabels: Record<string, string> = {
  cinematic: "Cinematic",
  slow_motion: "Slow Motion",
  zoom_in: "Zoom-In",
  orbit: "Orbit",
  dolly: "Dolly",
  static: "Statisch",
};

const filmEffectLabels: Record<string, string> = {
  dramatic: "Dramatisch",
  soft: "Weich",
  golden_hour: "Golden Hour",
  noir: "Noir",
  dreamy: "Verträumt",
};

/**
 * Payload schema for generate-video-prompt task.
 */
const GenerateVideoPromptPayloadSchema = z.object({
  videoPromptId: z.string().uuid(),
  imageId: z.string().uuid(),
  userId: z.string().uuid(),
  encryptedApiKey: z.string(),
  config: VideoPromptGenerationSchema,
  imageUrl: z.string().optional(),
  storagePath: z.string().optional(),
});

export type GenerateVideoPromptPayload = z.infer<typeof GenerateVideoPromptPayloadSchema>;

/**
 * Background task for generating a video prompt via Gemini API.
 *
 * Flow:
 * 1. Decrypt API key
 * 2. Download image from Supabase Storage
 * 3. Upload to Gemini Files API
 * 4. Wait for file to be ACTIVE
 * 5. Generate video prompt via Gemini
 * 6. Update video_prompts table with result
 * 7. Cleanup Gemini file
 */
export const generateVideoPromptTask = schemaTask({
  id: "generate-video-prompt",
  schema: GenerateVideoPromptPayloadSchema,
  maxDuration: 60, // 1 minute max
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload, { ctx }) => {
    const { videoPromptId, imageId, userId, encryptedApiKey, config, imageUrl, storagePath } = payload;
    const taskId = videoPromptId.slice(0, 8);

    logger.log(`[Task ${taskId}] Starting video prompt generation...`);

    // 1. Create Supabase admin client
    const supabase = createSupabaseAdmin();

    // 2. Decrypt API key
    const apiKey = decrypt(encryptedApiKey);
    if (!apiKey) {
      throw new Error("Failed to decrypt API key");
    }

    // 3. Verify ownership
    const hasAccess = await verifyImageOwnership(supabase, imageId, userId);
    if (!hasAccess) {
      throw new Error("Access denied: User does not own this image");
    }

    // 4. Initialize Gemini client
    const client = new GoogleGenAI({ apiKey });

    let geminiFile: { uri: string; name: string; mimeType: string } | null = null;

    try {
      // 5. Fetch image from Supabase storage
      let imageBlob: Blob;

      if (imageUrl && imageUrl.startsWith("http")) {
        // Image is publicly accessible, fetch via URL
        logger.log(`[Task ${taskId}] Fetching image from URL...`);
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch image from URL");
        }
        imageBlob = await response.blob();
      } else if (storagePath) {
        // Download from Supabase storage
        logger.log(`[Task ${taskId}] Downloading image from storage...`);
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("generated_images")
          .download(storagePath);

        if (downloadError || !fileData) {
          throw new Error("Failed to retrieve image from storage");
        }

        imageBlob = fileData;
      } else {
        throw new Error("Image has no accessible URL or storage path");
      }

      // 6. Upload to Gemini Files API
      geminiFile = await uploadToGemini(client, imageBlob, taskId);

      // 7. Wait for file to be ACTIVE
      const resourceName = extractResourceName(geminiFile.uri, geminiFile.name);
      const { active } = await waitForFileActive(client, resourceName, 10, taskId);

      if (!active) {
        logger.warn(`[Task ${taskId}] File may not be ready, proceeding anyway...`);
      }

      // 8. Generate video prompt via Gemini
      logger.log(`[Task ${taskId}] Generating video prompt...`);

      // Build user message with German labels
      const userMessage = `
Analysiere dieses Bild und erstelle einen Video-Prompt.

${config.userInstruction ? `Anweisungen: ${config.userInstruction}` : ""}

Kamera-Stil: ${cameraStyleLabels[config.cameraStyle]}
${config.filmEffects.length > 0 ? `Film-Effekte: ${config.filmEffects.map((e) => filmEffectLabels[e]).join(", ")}` : ""}
`.trim();

      const parts: any[] = [
        {
          fileData: {
            mimeType: geminiFile.mimeType,
            fileUri: geminiFile.uri,
          },
        },
        { text: userMessage },
      ];

      const result: any = await client.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: VIDEO_PROMPT_SYSTEM_PROMPT,
        },
        contents: [
          {
            role: "user",
            parts: parts,
          },
        ],
      });

      const candidate = result.candidates?.[0] || result.response?.candidates?.[0];
      const textPart = candidate?.content?.parts?.find((p: any) => p.text);

      if (!textPart || !textPart.text) {
        throw new Error("No video prompt generated. FinishReason: " + candidate?.finishReason);
      }

      const generatedPrompt = textPart.text.trim();
      logger.log(`[Task ${taskId}] Generated prompt (${generatedPrompt.length} chars)`);

      // 9. Update record with generated prompt_text and status 'completed'
      const { error: updateError } = await supabase
        .from("video_prompts")
        .update({
          status: "completed",
          prompt_text: generatedPrompt,
        })
        .eq("id", videoPromptId);

      if (updateError) {
        throw new Error("Failed to save generated prompt: " + updateError.message);
      }

      logger.log(`[Task ${taskId}] Success.`);

      return {
        success: true,
        videoPromptId,
        promptText: generatedPrompt,
      };
    } catch (err: any) {
      logger.error(`[Task ${taskId}] FAILED:`, { error: err });

      // Update status to 'failed' with error message
      const errorMessage = err.message || "Unknown error occurred";

      await supabase
        .from("video_prompts")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", videoPromptId);

      throw err; // Re-throw for retry
    } finally {
      // Cleanup Gemini file
      if (geminiFile) {
        await cleanupGeminiFile(client, geminiFile, taskId);
      }
    }
  },
});
