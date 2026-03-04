"use client"

import { useQuery } from "@tanstack/react-query"
import { getVideoPromptsForImageAction } from "@/app/actions/video-prompt-actions"

export function useVideoPrompts(imageId: string | null) {
  return useQuery({
    queryKey: ['video-prompts', imageId],
    queryFn: () => getVideoPromptsForImageAction(imageId!),
    enabled: !!imageId,
    staleTime: 30_000, // 30 seconds - prompts don't change often
    // Poll every 3 seconds if any prompt has status 'pending'
    refetchInterval: (query) => {
      const hasPending = query.state.data?.some((p: any) => p.status === 'pending');
      return hasPending ? 3000 : false;
    },
  })
}
