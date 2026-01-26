import { z } from "zod";

// Define constants to be used in both Schema and UI
export const CAMERA_STYLES = [
  "cinematic",
  "slow_motion",
  "zoom_in",
  "orbit",
  "dolly",
  "static"
] as const;

export const FILM_EFFECTS = [
  "dramatic",
  "soft",
  "golden_hour",
  "noir",
  "dreamy"
] as const;

// Create types from constants
export type CameraStyleType = typeof CAMERA_STYLES[number];
export type FilmEffectType = typeof FILM_EFFECTS[number];

// Zod schema for video prompt generation input
export const VideoPromptGenerationSchema = z.object({
  imageId: z.string().uuid(),
  userInstruction: z.string().max(500).optional(),
  cameraStyle: z.enum(CAMERA_STYLES).default("static"),
  filmEffects: z.array(z.enum(FILM_EFFECTS)).max(3).default([]),
});

export type VideoPromptGenerationConfig = z.infer<typeof VideoPromptGenerationSchema>;
