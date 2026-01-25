"use client"

import { Button } from "@/components/ui/button"
import { CAMERA_STYLES, FILM_EFFECTS, CameraStyleType, FilmEffectType } from "@/lib/video-prompt-schemas"

interface VideoPromptConfigProps {
  selectedCameraStyle: CameraStyleType | null
  selectedFilmEffect: FilmEffectType | null
  onCameraStyleChange: (style: CameraStyleType | null) => void
  onFilmEffectChange: (effect: FilmEffectType | null) => void
  disabled?: boolean
}

// German label mappings
const cameraStyleLabels: Record<CameraStyleType, string> = {
  cinematic: "Cinematic",
  slow_motion: "Slow Motion",
  zoom_in: "Zoom-In",
  orbit: "Orbit",
  dolly: "Dolly",
  static: "Statisch"
}

const filmEffectLabels: Record<FilmEffectType, string> = {
  dramatic: "Dramatisch",
  soft: "Weich",
  golden_hour: "Golden Hour",
  noir: "Noir",
  dreamy: "Verträumt"
}

export function VideoPromptConfig({
  selectedCameraStyle,
  selectedFilmEffect,
  onCameraStyleChange,
  onFilmEffectChange,
  disabled = false
}: VideoPromptConfigProps) {
  const handleCameraStyleClick = (style: CameraStyleType) => {
    // Toggle behavior: clicking selected chip deselects it
    onCameraStyleChange(selectedCameraStyle === style ? null : style)
  }

  const handleFilmEffectClick = (effect: FilmEffectType) => {
    // Toggle behavior: clicking selected chip deselects it
    onFilmEffectChange(selectedFilmEffect === effect ? null : effect)
  }

  return (
    <div className="space-y-6">
      {/* Camera Style Section */}
      <div>
        <h4 className="text-xs text-gray-500 mb-3">Kamerastil</h4>
        <div className="flex flex-wrap gap-2">
          {CAMERA_STYLES.map((style) => {
            const isSelected = selectedCameraStyle === style
            return (
              <Button
                key={style}
                onClick={() => handleCameraStyleClick(style)}
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
                {cameraStyleLabels[style]}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Film Effect Section */}
      <div>
        <h4 className="text-xs text-gray-500 mb-3">Filmeffekt</h4>
        <div className="flex flex-wrap gap-2">
          {FILM_EFFECTS.map((effect) => {
            const isSelected = selectedFilmEffect === effect
            return (
              <Button
                key={effect}
                onClick={() => handleFilmEffectClick(effect)}
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
                {filmEffectLabels[effect]}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
