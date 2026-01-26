import { GoogleGenAI } from "@google/genai";
import { ImageGenerationConfig, ImageGenerationSchema } from "@/lib/schemas";
import { IMAGE_GENERATION_SYSTEM_PROMPT } from "@/lib/prompts";
import { POSES } from "@/lib/poses";

export function validateImageGenerationConfig(data: ImageGenerationConfig) {
  const result = ImageGenerationSchema.safeParse(data);
  if (!result.success) {
    throw new Error("Validation failed: " + result.error.message);
  }
  return result.data;
}

export function selectPose(shotType: string, index: number, availablePoses: string[]): string {
  // If no poses provided, fallback to empty string or default behavior could be handled outside
  if (!availablePoses || availablePoses.length === 0) return "";
  return availablePoses[index % availablePoses.length];
}

// Helper to extract visual tokens/description from the first reference image
// DEPRECATED/REMOVED per user request

export async function refinePrompt(
  client: GoogleGenAI,
  config: ImageGenerationConfig,
  pose: string
): Promise<string> {
  const effectivePose = config.customPrompt ? config.customPrompt : pose;

  const promptRequest = `Generate a photography prompt for:
    Aspect Ratio: ${config.aspectRatio}
    Shot Type: ${config.shotType}
    Pose: ${effectivePose}
    Background: ${config.background === 'custom' ? config.backgroundPrompt : config.background === 'green' ? 'solid green background (chroma key)' : 'solid white background'}
    Custom Instructions: ${config.customPrompt || "None"}
  `;

  try {
    const result: any = await client.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: IMAGE_GENERATION_SYSTEM_PROMPT,
      },
      contents: [{ role: 'user', parts: [{ text: promptRequest }] }],
    });
    
    const candidate = result.candidates?.[0] || result.response?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    if (text) return text;
  } catch (error) {
    console.error("Prompt refinement failed, using fallback:", error);
  }

  // Fallback prompt
  const bgPrompt = config.background === 'custom' ? config.backgroundPrompt : config.background === 'green' ? 'solid green background (chroma key)' : 'solid white background';
  
  if (config.customPrompt) {
    return `${config.shotType} photo, ${config.customPrompt}, ${bgPrompt}.`;
  }
  return `${config.shotType} photo, pose: ${pose}, ${bgPrompt}.`;
}

// NOTE: processReferenceImages for inline data is DEPRECATED in favor of Files API in the action.
// We keep a minimal version or remove it if unused. It was used to fetch and convert to base64.
// For Files API, we need to fetch and save to disk, which is better done in the server action context.
// So we can remove processReferenceImages or leave it as is but unused.
// I will check if it's used elsewhere. It's imported in image-actions.ts, so I should probably leave it or remove it if I update image-actions.ts to not use it.
// I will remove it to avoid confusion, as the new flow is Files API.

/**
 * Generates an image using the provided client and inputs.
 * @param client The initialized Google GenAI Client
 * @param prompt The prompt to generate
 * @param referenceImageParts Array of parts (can be fileData parts now)
 * @param aspectRatio Aspect ratio string
 * @param modelName Model name to use
 */
export async function generateImage(
  client: GoogleGenAI, 
  prompt: string, 
  referenceImageParts: any[], 
  aspectRatio: string = "1:1",
  modelName: string = "gemini-2.5-flash" 
): Promise<string> {
  // Construct contents
  const parts: any[] = [{ text: prompt }];

  if (referenceImageParts && referenceImageParts.length > 0) {
    parts.push(...referenceImageParts);
  }
  
  let result: any;
  try {
    result = await client.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: parts }],
      config: {
        responseModalities: ["IMAGE"],
        // @ts-ignore - SDK might not have perfect update for imageConfig yet
        imageConfig: {
            aspectRatio: aspectRatio,
        }
      }
    });
  } catch (genError: any) {
    console.error("Gemini generation failed.", genError);
    if (genError.message?.includes("API key not valid") || genError.message?.includes("400 Bad Request")) {
       throw new Error(`Generation failed: ${genError.message}. Check parameters or model access.`);
    }
    throw genError;
  }

  const candidate = result.candidates?.[0] || result.response?.candidates?.[0]; // Support direct or wrapped
  if (!candidate) {
      throw new Error("No candidates returned from Gemini");
  }
  const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData);

  if (!imagePart || !imagePart.inlineData) {
       const textPart = candidate?.content?.parts?.find((p: any) => p.text);
       if (textPart) {
           throw new Error("Model returned text instead of image: " + textPart.text);
       }
       throw new Error("No inline image data found in response");
  }

  return imagePart.inlineData.data;
}
