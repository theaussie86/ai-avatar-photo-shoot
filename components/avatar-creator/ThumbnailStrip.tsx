"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ThumbnailImage {
  id: string
  url: string
  status?: string
}

interface ThumbnailStripProps {
  images: ThumbnailImage[]
  currentIndex: number
  onSelect: (index: number) => void
  className?: string
}

export function ThumbnailStrip({
  images,
  currentIndex,
  onSelect,
  className,
}: ThumbnailStripProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Scroll selected thumbnail into view
  React.useEffect(() => {
    if (containerRef.current) {
      const selectedThumb = containerRef.current.children[currentIndex] as HTMLElement
      if (selectedThumb) {
        selectedThumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        })
      }
    }
  }, [currentIndex])

  return (
    <div
      className={cn(
        "w-full border-t border-white/10 bg-black/60 backdrop-blur-sm",
        className
      )}
    >
      <div
        ref={containerRef}
        className="flex items-center justify-center gap-2 p-3 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      >
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => onSelect(index)}
            className={cn(
              "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black",
              currentIndex === index
                ? "ring-2 ring-purple-500 scale-105"
                : "ring-1 ring-white/20 hover:ring-white/40 opacity-70 hover:opacity-100"
            )}
          >
            <img
              src={image.url}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Number overlay */}
            <span
              className={cn(
                "absolute bottom-0.5 right-0.5 text-[10px] font-medium px-1 rounded",
                currentIndex === index
                  ? "bg-purple-500 text-white"
                  : "bg-black/60 text-white/80"
              )}
            >
              #{index + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
