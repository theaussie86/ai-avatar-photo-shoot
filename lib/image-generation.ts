import { GoogleGenerativeAI, Part } from "@google/generative-ai";
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

export async function refinePrompt(
  genAI: GoogleGenerativeAI,
  config: ImageGenerationConfig,
  pose: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.0-flash",
    systemInstruction: IMAGE_GENERATION_SYSTEM_PROMPT,
  });

  const promptRequest = `Generate a photography prompt for:
    Aspect Ratio: ${config.aspectRatio}
    Shot Type: ${config.shotType}
    Pose: ${pose}
    Background: ${config.background}
    Custom Instructions: ${config.customPrompt || "None"}
  `;

  try {
    const result = await model.generateContent(promptRequest);
    const text = result.response.text();
    if (text) return text;
  } catch (error) {
    console.error("Prompt refinement failed, using fallback:", error);
  }

  // Fallback prompt
  return `${config.shotType} photo, pose: ${pose}, ${config.background} background. ${config.customPrompt || ""}`;
}

export async function processReferenceImages(urls: string[]): Promise<Part[]> {
  if (!urls || urls.length === 0) return [];

  const parts: Part[] = [];
  const imagePromises = urls.map(async (url) => {
    try {
      // Handle potential relative URLs or missing protocol
      const fetchUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${url}`;

      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      return {
        inlineData: {
          data: base64,
          mimeType: contentType
        }
      } as Part;
    } catch (e) {
      console.error("Failed to load reference image:", e);
      return null;
    }
  });

  const loadedImages = await Promise.all(imagePromises);
  const validImages = loadedImages.filter((img): img is Part => img !== null);
  
  if (validImages.length > 0) {
    parts.push(...validImages);
  }

  return parts;
}

export async function generateImage(
  genAI: GoogleGenerativeAI, 
  prompt: string, 
  referenceImages: Part[], 
  modelName: string = "models/gemini-3-pro-image-preview"
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: modelName });
  const parts: Part[] = [{ text: prompt }];

  if (referenceImages && referenceImages.length > 0) {
    parts.push(...referenceImages);
  }
  
  let result;
  try {
    result = await model.generateContent({
      contents: [{ role: 'user', parts: parts }],
    });
  } catch (genError: any) {
    console.error("Gemini generation failed.", genError);
    if (genError.message?.includes("API key not valid") || genError.message?.includes("400 Bad Request")) {
       throw new Error(`Generation failed: ${genError.message}. Check parameters or model access.`);
    }
    throw genError;
  }

  const response = result.response;
  if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini");
  }

  const candidate = response.candidates[0];
  const imagePart = candidate.content.parts.find((p: any) => p.inlineData);

  if (!imagePart || !imagePart.inlineData) {
       const textPart = candidate.content.parts.find((p: any) => p.text);
       if (textPart) {
           throw new Error("Model returned text instead of image: " + textPart.text);
       }
       throw new Error("No inline image data found in response");
  }

  return imagePart.inlineData.data;
}
