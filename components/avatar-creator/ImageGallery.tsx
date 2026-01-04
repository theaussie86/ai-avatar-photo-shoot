"use client"

import { Button } from "@/components/ui/button"

export function ImageGallery() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Generierte Bilder</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder Error Card (as seen in screenshot) */}
        <div className="group relative aspect-[3/4] overflow-hidden rounded-xl border bg-muted/10">
          <div className="absolute top-3 left-3 z-10">
            <div className="rounded bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
              #1
            </div>
          </div>
          
          <div className="flex h-full w-full items-center justify-center bg-red-950/20 text-red-500 font-medium">
             Fehler
          </div>
        </div>
      </div>
    </div>
  )
}
