"use client"

import { useState } from "react"
import { useVideoPrompts } from "@/hooks/use-video-prompts"
import { useGenerateVideoPrompt } from "@/hooks/use-generate-video-prompt"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { VideoPromptConfig } from "@/components/avatar-creator/VideoPromptConfig"
import { CameraStyleType, FilmEffectType } from "@/lib/video-prompt-schemas"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertCircle, Video, Loader2, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface VideoPromptPanelProps {
  imageId: string | null
}

export function VideoPromptPanel({ imageId }: VideoPromptPanelProps) {
  const { data: prompts, isLoading, error } = useVideoPrompts(imageId)
  const generateMutation = useGenerateVideoPrompt()
  const { copy, isCopied, isError: copyError } = useCopyToClipboard()

  // Get most recent prompt (first in array, sorted by created_at desc)
  const currentPrompt = prompts?.[0]

  // State for configuration selections (defaults from CONTEXT.md)
  const [selectedCameraStyle, setSelectedCameraStyle] = useState<CameraStyleType | null>("cinematic")
  const [selectedFilmEffect, setSelectedFilmEffect] = useState<FilmEffectType | null>("soft")

  // Generate handler
  const handleGenerate = () => {
    if (!imageId) return

    generateMutation.mutate({
      imageId,
      cameraStyle: selectedCameraStyle || "static",
      filmEffects: selectedFilmEffect ? [selectedFilmEffect] : [],
    }, {
      onSuccess: () => {
        toast.success("Video-Prompt erstellt!")
      },
      onError: (error) => {
        toast.error("Fehler beim Erstellen", {
          description: error instanceof Error ? error.message : "Unbekannter Fehler"
        })
      }
    })
  }

  // Copy handler
  const handleCopy = async () => {
    if (!currentPrompt) return

    const success = await copy(currentPrompt.prompt_text)

    if (success) {
      toast.success("Kopiert!", {
        duration: 2000
      })
    } else {
      toast.error("Kopieren fehlgeschlagen", {
        description: "Text konnte nicht kopiert werden"
      })
    }
  }

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
          <div className="space-y-6">
            <VideoPromptConfig
              selectedCameraStyle={selectedCameraStyle}
              selectedFilmEffect={selectedFilmEffect}
              onCameraStyleChange={setSelectedCameraStyle}
              onFilmEffectChange={setSelectedFilmEffect}
              disabled={generateMutation.isPending}
            />
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generiere...
                </>
              ) : (
                "Video-Prompt erstellen"
              )}
            </Button>
          </div>
        )}

        {/* Prompt display - has content */}
        {!isLoading && !error && currentPrompt && (
          <div className="space-y-6">
            {/* Config controls for regeneration */}
            <VideoPromptConfig
              selectedCameraStyle={selectedCameraStyle}
              selectedFilmEffect={selectedFilmEffect}
              onCameraStyleChange={setSelectedCameraStyle}
              onFilmEffectChange={setSelectedFilmEffect}
              disabled={generateMutation.isPending}
            />
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              variant="outline"
              className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generiere neu...
                </>
              ) : (
                "Neuen Prompt erstellen"
              )}
            </Button>

            {/* Existing prompt display */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                {currentPrompt.prompt_text}
              </p>
            </div>

            {/* Copy button */}
            <Button
              onClick={handleCopy}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/5"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  Kopieren
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Kopieren
                </>
              )}
            </Button>

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
    </div>
  )
}
