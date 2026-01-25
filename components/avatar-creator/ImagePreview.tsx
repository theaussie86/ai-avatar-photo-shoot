"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { VideoPromptButton } from "@/components/avatar-creator/VideoPromptButton"
import { cn } from "@/lib/utils"

interface ImagePreviewProps {
  image: {
    id: string
    url: string
    status?: string
  }
  hasVideoPrompts?: boolean
  onVideoPromptClick?: () => void
  isSelected?: boolean
  className?: string
}

export function ImagePreview({
  image,
  hasVideoPrompts = false,
  onVideoPromptClick,
  isSelected = false,
  className,
}: ImagePreviewProps) {
  const [isLoaded, setIsLoaded] = React.useState(false)

  // Reset loading state when image URL changes
  React.useEffect(() => {
    setIsLoaded(false)
  }, [image.url])

  return (
    <div
      className={cn(
        "group relative aspect-square bg-zinc-900 rounded-lg overflow-hidden transition-all",
        isSelected && "ring-2 ring-purple-500 shadow-lg shadow-purple-500/20",
        className
      )}
    >
      {/* Letterbox container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Loading skeleton overlay */}
        {!isLoaded && (
          <Skeleton className="absolute inset-0 z-10" />
        )}

        {/* Image with letterbox */}
        <img
          src={image.url}
          alt={`Image ${image.id}`}
          className={cn(
            "object-contain max-w-full max-h-full transition-all duration-300",
            !isLoaded && "opacity-0",
            isLoaded && "opacity-100"
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)} // Show image even if error occurs
        />

        {/* Hover effect overlay */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none transition-all duration-200",
            "group-hover:scale-[1.02] group-hover:shadow-2xl"
          )}
        />
      </div>

      {/* Video prompt button - always visible */}
      {isLoaded && (
        <VideoPromptButton
          hasPrompts={hasVideoPrompts}
          onClick={onVideoPromptClick}
        />
      )}
    </div>
  )
}
