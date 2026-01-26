"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { generateVideoPromptAction } from "@/app/actions/video-prompt-actions"
import { VideoPromptGenerationConfig } from "@/lib/video-prompt-schemas"

export function useGenerateVideoPrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (config: VideoPromptGenerationConfig) =>
      generateVideoPromptAction(config),
    onSuccess: (data, variables) => {
      // Invalidate video prompts query to refetch with new prompt
      queryClient.invalidateQueries({
        queryKey: ['video-prompts', variables.imageId]
      })
    },
  })
}
