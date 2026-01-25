"use client"

import { useQuery } from "@tanstack/react-query"
import { getVideoPromptsForImageAction } from "@/app/actions/video-prompt-actions"

export function useVideoPrompts(imageId: string | null) {
  return useQuery({
    queryKey: ['video-prompts', imageId],
    queryFn: () => getVideoPromptsForImageAction(imageId!),
    enabled: !!imageId,
    staleTime: 30_000, // 30 seconds - prompts don't change often
  })
}
