import { schemaTask, logger } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseAdmin, verifyImageOwnership } from "./utils/supabase-admin";
import { extractResourceName, waitForFileActive, cleanupGeminiFile, uploadToGemini } from "./utils/gemini-helpers";
import { decrypt } from "@/lib/encryption";

/**
 * Payload schema for get-ai-suggestions task.
 */
const GetAISuggestionsPayloadSchema = z.object({
  imageId: z.string().uuid(),
  userId: z.string().uuid(),
  encryptedApiKey: z.string(),
  imageUrl: z.string().optional(),
  storagePath: z.string().optional(),
});

export type GetAISuggestionsPayload = z.infer<typeof GetAISuggestionsPayloadSchema>;

// System prompt for generating action suggestions
const AI_SUGGESTIONS_SYSTEM_PROMPT = `Du bist ein Experte für Video-Animationen. Analysiere dieses Bild einer Person und schlage 3-5 kurze Aktionen vor, die diese Person in einem animierten Video machen könnte.

Regeln:
- Antworte NUR mit einer JSON-Liste von Strings
- Jeder Vorschlag maximal 3-4 Wörter auf Deutsch
- Berücksichtige die Pose, Blickrichtung und den Kontext im Bild
- Vorschläge sollten natürlich und umsetzbar sein

Beispiel-Format: ["nach links schauen", "Augen schließen", "Kopf neigen"]`;

/**
 * Background task for generating AI action suggestions for an image.
 *
 * This is a MEDIUM priority task since suggestions are non-critical.
 * Returns empty array on failure.
 */
export const getAISuggestionsTask = schemaTask({
  id: "get-ai-suggestions",
  schema: GetAISuggestionsPayloadSchema,
  maxDuration: 30, // 30 seconds max
  retry: {
    maxAttempts: 2, // Lower retry since non-critical
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload, { ctx }) => {
    const { imageId, userId, encryptedApiKey, imageUrl, storagePath } = payload;
    const taskId = imageId.slice(0, 8);

    logger.log(`[Task ${taskId}] Starting AI suggestions generation...`);

    // 1. Create Supabase admin client
    const supabase = createSupabaseAdmin();

    // 2. Decrypt API key
    const apiKey = decrypt(encryptedApiKey);
    if (!apiKey) {
      logger.error(`[Task ${taskId}] Failed to decrypt API key`);
      return { success: false, suggestions: [] };
    }

    // 3. Verify ownership
    const hasAccess = await verifyImageOwnership(supabase, imageId, userId);
    if (!hasAccess) {
      logger.error(`[Task ${taskId}] Access denied`);
      return { success: false, suggestions: [] };
    }

    // 4. Initialize Gemini client
    const client = new GoogleGenAI({ apiKey });

    let geminiFile: { uri: string; name: string; mimeType: string } | null = null;

    try {
      // 5. Fetch image from Supabase storage
      let imageBlob: Blob;

      if (imageUrl && imageUrl.startsWith("http")) {
        logger.log(`[Task ${taskId}] Fetching image from URL...`);
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch image from URL");
        }
        imageBlob = await response.blob();
      } else if (storagePath) {
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
      await waitForFileActive(client, resourceName, 10, taskId);

      // 8. Generate suggestions via Gemini
      logger.log(`[Task ${taskId}] Generating AI suggestions...`);

      const parts: any[] = [
        {
          fileData: {
            mimeType: geminiFile.mimeType,
            fileUri: geminiFile.uri,
          },
        },
        { text: "Analysiere dieses Bild und gib mir 3-5 Aktions-Vorschläge." },
      ];

      const result: any = await client.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: AI_SUGGESTIONS_SYSTEM_PROMPT,
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
        logger.error(`[Task ${taskId}] No text generated`);
        return { success: false, suggestions: [] };
      }

      const generatedText = textPart.text.trim();
      logger.log(`[Task ${taskId}] Generated response: ${generatedText}`);

      // 9. Parse JSON response
      let suggestions: string[];
      try {
        // Try to extract JSON array from response (may have markdown code blocks)
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          logger.error(`[Task ${taskId}] No JSON array found in response`);
          return { success: false, suggestions: [] };
        }

        suggestions = JSON.parse(jsonMatch[0]);

        // Validate it's an array of strings
        if (!Array.isArray(suggestions) || !suggestions.every((s) => typeof s === "string")) {
          logger.error(`[Task ${taskId}] Response is not a valid string array`);
          return { success: false, suggestions: [] };
        }

        // Limit to 5 suggestions
        suggestions = suggestions.slice(0, 5);
      } catch (parseError) {
        logger.error(`[Task ${taskId}] Failed to parse JSON:`, { error: parseError });
        return { success: false, suggestions: [] };
      }

      logger.log(`[Task ${taskId}] Returning ${suggestions.length} suggestions:`, { suggestions });

      return {
        success: true,
        suggestions,
      };
    } catch (err: any) {
      logger.error(`[Task ${taskId}] Error generating suggestions:`, { error: err });
      return { success: false, suggestions: [] };
    } finally {
      // Cleanup Gemini file
      if (geminiFile) {
        await cleanupGeminiFile(client, geminiFile, taskId);
      }
    }
  },
});
