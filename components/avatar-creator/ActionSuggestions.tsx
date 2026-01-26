"use client"

import { Button } from "@/components/ui/button"

interface ActionSuggestionsProps {
  selectedSuggestions: string[]
  onToggle: (suggestion: string) => void
  disabled?: boolean
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
  disabled = false
}: ActionSuggestionsProps) {
  const handleSuggestionClick = (suggestion: string) => {
    onToggle(suggestion)
  }

  return (
    <div>
      <h4 className="text-xs text-gray-500 mb-3">Aktions-Vorschläge</h4>
      <div className="flex flex-wrap gap-2">
        {FIXED_SUGGESTIONS.map((suggestion) => {
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
              {suggestion}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
