"use client"

import { Video } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPromptButtonProps {
  promptCount?: number
  onClick?: () => void
}

export function VideoPromptButton({ promptCount = 0, onClick }: VideoPromptButtonProps) {
  return (
    <div className="absolute bottom-3 right-3">
      <Button
        variant="ghost"
        size="icon"
        className="relative bg-purple-600 backdrop-blur-sm text-white hover:bg-purple-500 border border-purple-400/30 shadow-lg shadow-purple-500/20 transition-all"
        onClick={onClick}
      >
        <Video className="h-4 w-4" />
        {promptCount === 1 && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 border-2 border-black animate-pulse" />
        )}
        {promptCount > 1 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-green-400 border-2 border-black flex items-center justify-center text-xs font-medium text-black">
            {promptCount}
          </span>
        )}
      </Button>
    </div>
  )
}
