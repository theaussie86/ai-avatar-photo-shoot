"use client"

import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface ActionSuggestionsProps {
  selectedSuggestions: string[]
  onToggle: (suggestion: string) => void
  disabled?: boolean
  aiSuggestions?: string[]
  isLoadingAI?: boolean
}

// Fixed action suggestions in German
const FIXED_SUGGESTIONS = [
  "lächeln",
  "winken",
  "nicken",
  "drehen"
] as const

export function ActionSuggestions({
  selectedSuggestions,
  onToggle,
  disabled = false,
  aiSuggestions = [],
  isLoadingAI = false
}: ActionSuggestionsProps) {
  const handleSuggestionClick = (suggestion: string) => {
    onToggle(suggestion)
  }

  const renderSuggestionChip = (suggestion: string, isAI: boolean = false) => {
    const isSelected = selectedSuggestions.includes(suggestion)
    return (
      <Button
        key={suggestion}
        onClick={() => handleSuggestionClick(suggestion)}
        disabled={disabled}
        variant="outline"
        className={`
          rounded-full px-3 py-1 h-auto text-xs transition-colors
          ${isSelected
            ? "bg-purple-500/20 border-purple-500 text-purple-400"
            : "bg-transparent border-white/10 text-gray-400 hover:border-white/20"
          }
          ${disabled ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        {isAI && <Sparkles className="h-3 w-3 mr-1.5" />}
        {suggestion}
      </Button>
    )
  }

  const hasAISuggestions = aiSuggestions.length > 0 || isLoadingAI

  return (
    <div className="space-y-4">
      {/* Fixed suggestions section */}
      <div>
        <h4 className="text-xs text-gray-500 mb-3">Aktions-Vorschläge</h4>
        <div className="flex flex-wrap gap-2">
          {FIXED_SUGGESTIONS.map((suggestion) => renderSuggestionChip(suggestion, false))}
        </div>
      </div>

      {/* AI suggestions section - only show if loading or has suggestions */}
      {hasAISuggestions && (
        <div>
          <h4 className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-purple-400" />
            KI-Vorschläge
          </h4>
          <div className="flex flex-wrap gap-2">
            {isLoadingAI ? (
              // Loading skeleton chips
              <>
                <div className="rounded-full px-3 py-1 h-6 w-20 bg-white/5 animate-pulse" />
                <div className="rounded-full px-3 py-1 h-6 w-24 bg-white/5 animate-pulse" />
                <div className="rounded-full px-3 py-1 h-6 w-20 bg-white/5 animate-pulse" />
              </>
            ) : (
              // AI suggestion chips with sparkle icon
              aiSuggestions.map((suggestion) => renderSuggestionChip(suggestion, true))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
