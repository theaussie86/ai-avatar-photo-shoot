"use client"

import { useVideoPrompts } from "@/hooks/use-video-prompts"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertCircle, Video } from "lucide-react"

interface VideoPromptPanelProps {
  imageId: string | null
}

export function VideoPromptPanel({ imageId }: VideoPromptPanelProps) {
  const { data: prompts, isLoading, error } = useVideoPrompts(imageId)

  // Get most recent prompt (first in array, sorted by created_at desc)
  const currentPrompt = prompts?.[0]

  return (
    <div className="flex flex-col h-full">
      {/* Header with border separator */}
      <div className="px-4 py-3 border-b border-white/10 shrink-0">
        <h3 className="text-lg font-semibold text-white">Video Prompt</h3>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400">Fehler beim Laden</p>
              <p className="text-xs text-gray-500 mt-1">
                {error instanceof Error ? error.message : "Unbekannter Fehler"}
              </p>
            </div>
          </div>
        )}

        {/* Empty state - no prompts exist */}
        {!isLoading && !error && !currentPrompt && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <Video className="h-6 w-6 text-purple-500" />
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Noch kein Video-Prompt vorhanden
            </p>
            <Button
              variant="outline"
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              disabled
            >
              Generiere einen Video-Prompt
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Kommt in Phase 5
            </p>
          </div>
        )}

        {/* Prompt display - has content */}
        {!isLoading && !error && currentPrompt && (
          <div className="space-y-4">
            {/* Prompt text in styled container */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                {currentPrompt.prompt_text}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Erstellt: {new Date(currentPrompt.created_at).toLocaleDateString('de-DE')}</span>
              {currentPrompt.camera_style && (
                <>
                  <span>•</span>
                  <span className="capitalize">{currentPrompt.camera_style.replace('_', ' ')}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action area at bottom (placeholder for Phase 6) */}
      <div className="px-4 py-3 border-t border-white/10 shrink-0">
        <Button
          className="w-full"
          variant="outline"
          disabled
        >
          Kopieren (Phase 6)
        </Button>
      </div>
    </div>
  )
}
