import { z } from "zod";

// Define constants to be used in both Schema and UI
export const ASPECT_RATIOS = [
  "Auto", 
  "1:1", 
  "9:16", 
  "16:9", 
  "3:4", 
  "4:3", 
  "3:2", 
  "2:3", 
  "5:4", 
  "4:5", 
  "21:9"
] as const;

export type AspectRatioType = typeof ASPECT_RATIOS[number];

export const SHOT_TYPES = [
  "full_body", 
  "upper_body", 
  "face"
] as const;

export type ShotType = typeof SHOT_TYPES[number];

export const GENERATION_MODELS = [
  "models/gemini-2.5-flash-image",
  "models/gemini-3-pro-image-preview",
] as const;

export type GenerationModel = typeof GENERATION_MODELS[number];

export const ImageGenerationSchema = z.object({
  imageCount: z.array(z.number().min(1).max(40)).length(1),
  referenceImages: z.array(z.string()).max(3),
  background: z.enum(["white", "green", "custom"]),
  backgroundPrompt: z.string().optional(),
  aspectRatio: z.enum(ASPECT_RATIOS),
  shotType: z.enum(SHOT_TYPES),
  customPrompt: z.string().optional(),
  collectionName: z.string().min(1, "Bitte gib einen Namen für die Sammlung ein"),
  collectionId: z.string().optional(),
  tempStorageId: z.string().optional(),
  model: z.enum(GENERATION_MODELS).optional().default("models/gemini-2.5-flash-image"),
});

export const ApiKeySchema = z.object({
  apiKey: z.string().min(1, "API Key ist erforderlich"),
});

export type ImageGenerationConfig = z.infer<typeof ImageGenerationSchema>;
export type ApiKeyConfig = z.infer<typeof ApiKeySchema>;
