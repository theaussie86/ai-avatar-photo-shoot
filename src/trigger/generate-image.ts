import { schemaTask, logger, metadata } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseAdmin, verifyImageOwnership } from "./utils/supabase-admin";
import { extractResourceName, waitForFileActive } from "./utils/gemini-helpers";
import { decrypt } from "@/lib/encryption";
import { ImageGenerationSchema } from "@/lib/schemas";

/**
 * Error codes for categorizing failures
 */
const ERROR_CODES = {
  API_KEY_INVALID: {
    code: 'API_KEY_INVALID',
    message: 'Gemini API key is invalid or expired'
  },
  QUOTA_EXCEEDED: {
    code: 'QUOTA_EXCEEDED',
    message: 'API quota exceeded. Try again later.'
  },
  FILE_TIMEOUT: {
    code: 'FILE_TIMEOUT',
    message: 'Reference images took too long to process'
  },
  GENERATION_FAILED: {
    code: 'GENERATION_FAILED',
    message: 'Image generation failed'
  },
  UPLOAD_FAILED: {
    code: 'UPLOAD_FAILED',
    message: 'Failed to save generated image'
  },
  UNKNOWN: {
    code: 'UNKNOWN',
    message: 'An unexpected error occurred'
  },
} as const;

type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Categorizes errors by pattern-matching error messages
 */
function categorizeError(error: unknown): ErrorCode {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('api key') || lowerMessage.includes('invalid_api_key')) {
    return ERROR_CODES.API_KEY_INVALID;
  }
  if (lowerMessage.includes('quota') || lowerMessage.includes('resource_exhausted')) {
    return ERROR_CODES.QUOTA_EXCEEDED;
  }
  if (lowerMessage.includes('timeout') || (lowerMessage.includes('file') && lowerMessage.includes('processing'))) {
    return ERROR_CODES.FILE_TIMEOUT;
  }
  if (lowerMessage.includes('upload') || lowerMessage.includes('storage')) {
    return ERROR_CODES.UPLOAD_FAILED;
  }
  if (lowerMessage.includes('generation') || lowerMessage.includes('generate')) {
    return ERROR_CODES.GENERATION_FAILED;
  }

  return ERROR_CODES.UNKNOWN;
}

/**
 * Payload schema for generate-image task.
 * encryptedApiKey is passed from the server action (still encrypted).
 */
const GenerateImagePayloadSchema = z.object({
  imageId: z.string().uuid(),
  userId: z.string().uuid(),
  encryptedApiKey: z.string(),
  prompt: z.string(),
  config: ImageGenerationSchema,
});

export type GenerateImagePayload = z.infer<typeof GenerateImagePayloadSchema>;

/**
 * Background task for generating a single image via Gemini API.
 *
 * Flow:
 * 1. Decrypt API key
 * 2. Verify image ownership (bypassing RLS with service role)
 * 3. Wait for reference images to be ACTIVE in Gemini
 * 4. Call Gemini image generation
 * 5. Upload result to Supabase Storage
 * 6. Update DB with completed status
 * 7. Cleanup Gemini files (if no other tasks need them)
 */
export const generateImageTask = schemaTask({
  id: "generate-image",
  schema: GenerateImagePayloadSchema,
  maxDuration: 120, // 2 minutes max
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 60000,
  },
  run: async (payload, { ctx }) => {
    const { imageId, userId, encryptedApiKey, prompt, config } = payload;
    const taskId = imageId.slice(0, 8);

    logger.log(`[Task ${taskId}] Starting image generation...`);

    // Stage 1: Queued
    await metadata.save({
      stage: 'queued',
      imageId
    });

    // 1. Create Supabase admin client
    const supabase = createSupabaseAdmin();

    const uploadedFiles: { name: string; uri: string }[] = [];
    const referenceImageUris = config.referenceImages || [];
    let client: GoogleGenAI | null = null;

    try {
      // Stage 2: Processing (decrypt, verify)
      await metadata.save({
        stage: 'processing',
        imageId
      });

      // 2. Decrypt API key
      const apiKey = decrypt(encryptedApiKey);
      if (!apiKey) {
        throw new Error("Failed to decrypt API key");
      }

      // 3. Verify ownership (since we bypass RLS)
      const hasAccess = await verifyImageOwnership(supabase, imageId, userId);
      if (!hasAccess) {
        throw new Error("Access denied: User does not own this image");
      }

      // 4. Initialize Gemini client
      client = new GoogleGenAI({ apiKey });

      // Stage 3: Generating
      await metadata.save({
        stage: 'generating',
        imageId
      });

      // 5. Prepare Reference Images using already uploaded Gemini Files
      const parts: any[] = [];
      let explicitRefInstruction = "";

      if (referenceImageUris.length > 0) {
        logger.log(`[Task ${taskId}] Using ${referenceImageUris.length} pre-uploaded Gemini references`);
        explicitRefInstruction = " Use the attached reference image(s) to preserve the subject's identity, facial features, and likeness in the generated image.";

        for (const uri of referenceImageUris) {
          const resourceName = extractResourceName(uri);

          if (resourceName) {
            uploadedFiles.push({ name: resourceName, uri });

            // Wait for file to be ACTIVE
            const { active, mimeType } = await waitForFileActive(client, resourceName, 10, taskId);

            if (!active) {
              logger.warn(`[Task ${taskId}] File ${resourceName} may not be ready, proceeding anyway...`);
            }

            parts.push({
              fileData: {
                mimeType,
                fileUri: uri,
              },
            });
          }
        }
      }

      // Add the prompt text part first
      parts.unshift({ text: prompt + explicitRefInstruction });

      // 6. Generate image via Gemini
      const modelName = config.model || "gemini-2.5-flash-image";
      logger.log(`[Task ${taskId}] Calling Gemini Model: ${modelName}`);

      const generateConfig: any = {
        responseModalities: ["IMAGE"],
      };

      if (config.aspectRatio && config.aspectRatio !== "Auto") {
        generateConfig.imageConfig = {
          aspectRatio: config.aspectRatio,
        };
      }

      const result: any = await client.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: parts }],
        config: generateConfig,
      });

      const candidate = result.candidates?.[0] || result.response?.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData);

      if (!imagePart || !imagePart.inlineData) {
        logger.error(`[Task ${taskId}] No image. FinishReason: ${candidate?.finishReason}`);
        throw new Error("No image generated. FinishReason: " + candidate?.finishReason);
      }

      const base64Data = imagePart.inlineData.data;
      const buffer = Buffer.from(base64Data, "base64");

      // 7. Upload to Supabase Storage
      logger.log(`[Task ${taskId}] Uploading to storage...`);

      const { data: img } = await supabase
        .from("images")
        .select("collection_id")
        .eq("id", imageId)
        .single();

      const collectionId = img?.collection_id || "unknown";
      const storagePath = `${collectionId}/${crypto.randomUUID()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("generated_images")
        .upload(storagePath, buffer, { contentType: "image/png" });

      if (uploadError) {
        throw new Error("Upload failed: " + uploadError.message);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("generated_images").getPublicUrl(storagePath);

      // 8. Update DB with success
      logger.log(`[Task ${taskId}] Done! Updating DB...`);

      const { error: updateError } = await supabase
        .from("images")
        .update({
          status: "completed",
          url: publicUrl,
          storage_path: storagePath,
        })
        .eq("id", imageId);

      if (updateError) {
        throw new Error("DB Update failed: " + updateError.message);
      }

      logger.log(`[Task ${taskId}] Success.`);

      return {
        success: true,
        imageId,
        url: publicUrl,
        storagePath,
      };
    } catch (err: any) {
      logger.error(`[Task ${taskId}] FAILED:`, { error: err });

      // Categorize and store error
      const errorInfo = categorizeError(err);

      await metadata.save({
        stage: 'failed',
        imageId,
        error: errorInfo
      });

      // Update DB with error
      await supabase
        .from("images")
        .update({
          status: "failed",
          error_code: errorInfo.code,
          error_message: errorInfo.message,
        })
        .eq("id", imageId);

      throw err; // Re-throw for retry
    } finally {
      // Cleanup Gemini files if no other pending/failed images need them
      if (uploadedFiles.length > 0 && client) {
        try {
          const { data: activeImages } = await supabase
            .from("images")
            .select("metadata")
            .in("status", ["pending", "failed"]);

          const allNeededUris = new Set<string>();
          activeImages?.forEach((img) => {
            const imgConfig = (img.metadata as any)?.config;
            imgConfig?.referenceImages?.forEach((uri: string) => allNeededUris.add(uri));
          });

          for (const file of uploadedFiles) {
            if (!allNeededUris.has(file.uri)) {
              logger.log(`[Task ${taskId}] Cleaning up Gemini file: ${file.name}`);
              await client.files.delete({ name: file.name }).catch(() => {});
            } else {
              logger.log(`[Task ${taskId}] File ${file.name} still needed by other tasks, skipping cleanup.`);
            }
          }
        } catch (cleanupError) {
          logger.error(`[Task ${taskId}] Error during cleanup:`, { error: cleanupError });
        }
      }
    }
  },
});
