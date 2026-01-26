"use client"

import { useState } from "react"
import { useVideoPrompts } from "@/hooks/use-video-prompts"
import { useGenerateVideoPrompt } from "@/hooks/use-generate-video-prompt"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { useAISuggestions } from "@/hooks/use-ai-suggestions"
import { VideoPromptConfig } from "@/components/avatar-creator/VideoPromptConfig"
import { ActionSuggestions } from "@/components/avatar-creator/ActionSuggestions"
import { PromptLengthFeedback } from "@/components/avatar-creator/PromptLengthFeedback"
import { CameraStyleType, FilmEffectType } from "@/lib/video-prompt-schemas"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, Copy, Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"

interface VideoPromptPanelProps {
  imageId: string | null
}

export function VideoPromptPanel({ imageId }: VideoPromptPanelProps) {
  const { data: prompts, isLoading, error } = useVideoPrompts(imageId)
  const generateMutation = useGenerateVideoPrompt()
  const { copy, isCopied } = useCopyToClipboard()
  const { data: aiSuggestions, isLoading: isLoadingAI } = useAISuggestions(imageId)

  // Variant navigation state - stores {imageId, index} to auto-reset on imageId change
  const [variantState, setVariantState] = useState<{imageId: string | null, index: number}>({
    imageId: null,
    index: 0
  })

  // Compute effective variant index - reset to 0 if imageId changed
  const effectiveVariantIndex = variantState.imageId === imageId ? variantState.index : 0

  // Helper to update variant index
  const setVariantIndex = (updater: (prev: number) => number) => {
    setVariantState(prev => ({
      imageId,
      index: updater(prev.imageId === imageId ? prev.index : 0)
    }))
  }

  // Get current prompt based on effective variant index
  const currentPrompt = prompts?.[effectiveVariantIndex]

  // State for configuration selections - used in empty state for new prompt creation
  const [selectedCameraStyle, setSelectedCameraStyle] = useState<CameraStyleType | null>("cinematic")
  const [selectedFilmEffect, setSelectedFilmEffect] = useState<FilmEffectType | null>("soft")

  // State for action suggestions and custom instruction
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])
  const [customInstruction, setCustomInstruction] = useState("")

  // State for collapsible new variant section in content state
  const [isNewVariantExpanded, setIsNewVariantExpanded] = useState(false)

  // In content state, show the current variant's config (read-only display via metadata)
  // Config state is only used for new prompt creation (empty state and +Neu button)

  // Suggestion toggle handler
  const handleSuggestionToggle = (suggestion: string) => {
    setSelectedSuggestions(prev =>
      prev.includes(suggestion)
        ? prev.filter(s => s !== suggestion)
        : [...prev, suggestion]
    )
  }

  // Derive userInstruction from selected suggestions and custom text
  const deriveUserInstruction = () => {
    const parts: string[] = []

    if (selectedSuggestions.length > 0) {
      parts.push(selectedSuggestions.join(", "))
    }

    if (customInstruction.trim()) {
      parts.push(customInstruction.trim())
    }

    return parts.join(". ")
  }

  // Generate handler
  const handleGenerate = () => {
    if (!imageId) return

    const userInstruction = deriveUserInstruction()

    generateMutation.mutate({
      imageId,
      cameraStyle: selectedCameraStyle || "static",
      filmEffects: selectedFilmEffect ? [selectedFilmEffect] : [],
      userInstruction: userInstruction || undefined,
    }, {
      onSuccess: () => {
        // Clear suggestions and custom instruction on success
        setSelectedSuggestions([])
        setCustomInstruction("")
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
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-white">Video Prompt</h3>
          {prompts && prompts.length > 0 && (
            <span className="text-sm text-gray-400 ml-2">
              {effectiveVariantIndex + 1} von {prompts.length}
            </span>
          )}
        </div>
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
            {/* Action Suggestions */}
            <ActionSuggestions
              selectedSuggestions={selectedSuggestions}
              onToggle={handleSuggestionToggle}
              aiSuggestions={aiSuggestions}
              isLoadingAI={isLoadingAI}
              disabled={generateMutation.isPending}
            />

            {/* Custom Instruction Textarea */}
            <div>
              <label htmlFor="custom-instruction" className="text-xs text-gray-500 mb-2 block">
                Eigene Anweisungen (optional)
              </label>
              <textarea
                id="custom-instruction"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                disabled={generateMutation.isPending}
                placeholder="z.B. langsam nach rechts schauen..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 resize-none"
                rows={3}
              />
            </div>

            {/* Configuration */}
            <VideoPromptConfig
              selectedCameraStyle={selectedCameraStyle}
              selectedFilmEffect={selectedFilmEffect}
              onCameraStyleChange={setSelectedCameraStyle}
              onFilmEffectChange={setSelectedFilmEffect}
              disabled={generateMutation.isPending}
            />

            {/* Generate Button */}
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
          <div className="space-y-4">
            {/* Variant navigation - only show when multiple variants */}
            {/* Left arrow = older (higher index), Right arrow = newer (lower index) */}
            {prompts && prompts.length > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                  onClick={() => setVariantIndex(prev => prev + 1)}
                  disabled={effectiveVariantIndex === prompts.length - 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-400">
                  {effectiveVariantIndex + 1} von {prompts.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                  onClick={() => setVariantIndex(prev => prev - 1)}
                  disabled={effectiveVariantIndex === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Prompt text display */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                {currentPrompt.prompt_text}
              </p>
            </div>

            {/* Prompt Length Feedback */}
            <PromptLengthFeedback text={currentPrompt.prompt_text} />

            {/* Action buttons row */}
            <div className="flex gap-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1 bg-white/5 border-white/20 text-gray-200 hover:bg-white/10 hover:text-white hover:border-white/30"
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Kopieren
                  </>
                )}
              </Button>
              <Button
                onClick={() => setIsNewVariantExpanded(!isNewVariantExpanded)}
                variant="outline"
                className="flex-1 bg-purple-600/10 border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:border-purple-600 hover:text-white"
              >
                + Neu
                {isNewVariantExpanded ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>
            </div>

            {/* Collapsible new variant section */}
            {isNewVariantExpanded && (
              <div className="space-y-4 pt-2 border-t border-white/10">
                {/* Action Suggestions */}
                <ActionSuggestions
                  selectedSuggestions={selectedSuggestions}
                  onToggle={handleSuggestionToggle}
                  aiSuggestions={aiSuggestions}
                  isLoadingAI={isLoadingAI}
                  disabled={generateMutation.isPending}
                />

                {/* Custom Instruction Textarea */}
                <div>
                  <label htmlFor="custom-instruction-variant" className="text-xs text-gray-500 mb-2 block">
                    Eigene Anweisungen (optional)
                  </label>
                  <textarea
                    id="custom-instruction-variant"
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    disabled={generateMutation.isPending}
                    placeholder="z.B. langsam nach rechts schauen..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 resize-none"
                    rows={2}
                  />
                </div>

                {/* Configuration */}
                <VideoPromptConfig
                  selectedCameraStyle={selectedCameraStyle}
                  selectedFilmEffect={selectedFilmEffect}
                  onCameraStyleChange={setSelectedCameraStyle}
                  onFilmEffectChange={setSelectedFilmEffect}
                  disabled={generateMutation.isPending}
                />

                {/* Generate Button */}
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
                    "Variante erstellen"
                  )}
                </Button>
              </div>
            )}

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
