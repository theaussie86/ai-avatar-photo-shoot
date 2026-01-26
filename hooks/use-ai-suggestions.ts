import { useQuery } from "@tanstack/react-query"
import { getAISuggestionsForImageAction } from "@/app/actions/video-prompt-actions"

export function useAISuggestions(imageId: string | null) {
  return useQuery({
    queryKey: ["ai-suggestions", imageId],
    queryFn: () => getAISuggestionsForImageAction(imageId!),
    enabled: !!imageId,
    staleTime: 5 * 60 * 1000,  // 5 minutes - suggestions don't need frequent refresh
    retry: 1,  // Only retry once, suggestions are non-critical
  })
}
