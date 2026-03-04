import { GoogleGenAI } from "@google/genai";
import { logger } from "@trigger.dev/sdk/v3";

/**
 * Extracts the Gemini resource name from a file URI.
 * Handles both full URIs and short names.
 */
export function extractResourceName(fileUri: string, fileName?: string): string {
  if (fileUri.includes("/files/")) {
    return "files/" + fileUri.split("/files/")[1];
  }
  return fileName || "";
}

/**
 * Waits for a Gemini file to become ACTIVE.
 * Polls with 2s intervals up to maxAttempts times.
 * Returns the detected mimeType if available.
 */
export async function waitForFileActive(
  client: GoogleGenAI,
  resourceName: string,
  maxAttempts: number = 10,
  taskId?: string
): Promise<{ active: boolean; mimeType: string }> {
  const prefix = taskId ? `[Task ${taskId}]` : "[Gemini]";
  let status = "PROCESSING";
  let attempts = 0;
  let detectedMimeType = "image/jpeg";

  while (status === "PROCESSING" && attempts < maxAttempts) {
    try {
      const fileStatus = await client.files.get({ name: resourceName });
      status = fileStatus.state || "FAILED";

      if (fileStatus.mimeType) {
        detectedMimeType = fileStatus.mimeType;
      }

      if (status === "PROCESSING") {
        logger.log(`${prefix} File ${resourceName} still processing, waiting 2s (Attempt ${attempts + 1}/${maxAttempts})...`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (statusError) {
      logger.error(`${prefix} Failed to check status for ${resourceName}:`, { error: statusError });
      break;
    }
    attempts++;
  }

  if (status !== "ACTIVE") {
    logger.warn(`${prefix} File ${resourceName} is in state ${status} after ${attempts} attempts.`);
  }

  return { active: status === "ACTIVE", mimeType: detectedMimeType };
}

/**
 * Cleans up a Gemini file. Non-fatal if cleanup fails.
 */
export async function cleanupGeminiFile(
  client: GoogleGenAI,
  geminiFile: { uri?: string; name?: string },
  taskId?: string
): Promise<void> {
  const prefix = taskId ? `[Task ${taskId}]` : "[Gemini]";

  try {
    const resourceName = extractResourceName(geminiFile.uri || "", geminiFile.name);

    if (!resourceName) {
      logger.warn(`${prefix} Cannot cleanup - no resource name available`);
      return;
    }

    await client.files.delete({ name: resourceName });
    logger.log(`${prefix} Cleaned up Gemini file: ${resourceName}`);
  } catch (cleanupError) {
    logger.error(`${prefix} Failed to cleanup Gemini file:`, { error: cleanupError });
    // Non-fatal, continue
  }
}

/**
 * Uploads an image blob to Gemini Files API.
 * Returns the file object with uri.
 */
export async function uploadToGemini(
  client: GoogleGenAI,
  imageBlob: Blob,
  taskId?: string
): Promise<{ uri: string; name: string; mimeType: string }> {
  const prefix = taskId ? `[Task ${taskId}]` : "[Gemini]";
  const mimeType = imageBlob.type || "image/jpeg";

  logger.log(`${prefix} Uploading image to Gemini (${mimeType}, ${imageBlob.size} bytes)...`);

  const uploadResult: any = await client.files.upload({
    file: imageBlob,
    config: { mimeType },
  });

  const geminiFile = uploadResult.file || uploadResult;

  if (!geminiFile.uri) {
    throw new Error("Gemini upload failed: No URI returned");
  }

  logger.log(`${prefix} Uploaded to Gemini: ${geminiFile.uri}`);

  return {
    uri: geminiFile.uri,
    name: geminiFile.name || extractResourceName(geminiFile.uri),
    mimeType,
  };
}
