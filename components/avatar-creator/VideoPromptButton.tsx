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
        className="relative bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 border border-white/10 transition-all"
        onClick={onClick}
      >
        <Video className="h-4 w-4" />
        {hasPrompts && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-500 border-2 border-black" />
        )}
      </Button>
    </div>
  )
}
