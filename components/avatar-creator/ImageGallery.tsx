"use client"

import { Button } from "@/components/ui/button"

export function ImageGallery({ images = [] }: { images?: string[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight text-white">Generierte Bilder</h2>
      
      {images.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          Noch keine Bilder generiert.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img, idx) => (
             <div key={idx} className="group relative aspect-[3/4] overflow-hidden rounded-xl border bg-muted/10">
               <div className="absolute top-3 left-3 z-10">
                 <div className="rounded bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
                   #{idx + 1}
                 </div>
               </div>
               <img src={img} alt={`Generated ${idx + 1}`} className="h-full w-full object-cover" />
             </div>
          ))}
        </div>
      )}
    </div>
  )
}
