import { z } from "zod";

export const ImageGenerationSchema = z.object({
  imageCount: z.array(z.number().min(1).max(40)).length(1),
  referenceImages: z.array(z.string()).max(3),
  background: z.enum(["white", "green", "custom"]),
  customBgImage: z.string().nullable().optional(),
  aspectRatio: z.enum(["1:1", "9:16", "4:5", "3:4", "4:3", "16:9", "21:9"]),
  shotType: z.enum(["Ganzkörper", "Oberkörper", "Nahaufnahme Gesicht"]),
  customPrompt: z.string().optional(),
  collectionName: z.string().min(1, "Bitte gib einen Namen für die Sammlung ein"),
  collectionId: z.string().optional(),
});

export const ApiKeySchema = z.object({
  apiKey: z.string().min(1, "API Key ist erforderlich"),
});

export type ImageGenerationConfig = z.infer<typeof ImageGenerationSchema>;
export type ApiKeyConfig = z.infer<typeof ApiKeySchema>;
