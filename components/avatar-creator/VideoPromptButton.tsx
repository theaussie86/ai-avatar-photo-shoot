"use client"

import { Video } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPromptButtonProps {
  hasPrompts?: boolean
  onClick?: () => void
}

export function VideoPromptButton({ hasPrompts = false, onClick }: VideoPromptButtonProps) {
  return (
    <div className="absolute bottom-3 right-3">
      <Button
        variant="ghost"
        size="icon"
        className="relative bg-purple-600 backdrop-blur-sm text-white hover:bg-purple-500 border border-purple-400/30 shadow-lg shadow-purple-500/20 transition-all"
        onClick={onClick}
      >
        <Video className="h-4 w-4" />
        {hasPrompts && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 border-2 border-black animate-pulse" />
        )}
      </Button>
    </div>
  )
}
