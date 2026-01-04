"use client"

import * as React from "react"
import { Lock, Upload, Image as ImageIcon, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function ConfigurationPanel() {
  const [imageCount, setImageCount] = React.useState([1])

  return (
    <div className="space-y-8 p-6 rounded-xl border bg-card/50 backdrop-blur-sm">
      
      {/* Reference Images */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Referenzbilder</Label>
          <div className="flex gap-1 text-muted-foreground">
             <div className="h-2 w-2 rounded-full bg-purple-500" />
             <Lock className="h-3 w-3" />
             <Lock className="h-3 w-3" />
          </div>
        </div>
        
        <div className="flex gap-3">
           <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-purple-500/50 shadow-sm transition-all hover:border-purple-500">
             <img src="https://github.com/shadcn.png" alt="Reference" className="h-full w-full object-cover" />
           </div>
           
           <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-not-allowed opacity-50">
             <Lock className="h-6 w-6 text-muted-foreground" />
           </div>
        </div>
      </div>

      {/* Background */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Hintergrund</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" className="w-full justify-start bg-white text-black hover:bg-white/90 border-0 ring-2 ring-white">
             Weißer Hintergrund
          </Button>
          <Button variant="outline" className="w-full justify-start bg-green-900/20 text-green-500 border-green-900/50 relative overflow-hidden" disabled>
             <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
               <Lock className="h-4 w-4" />
             </div>
             Greenscreen
          </Button>
          <Button variant="outline" className="w-full justify-start bg-muted/20 text-muted-foreground relative overflow-hidden h-auto py-2" disabled>
             <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
               <Lock className="h-4 w-4" />
             </div>
             <span className="truncate">Eigene Szenerie</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Aspect Ratio */}
        <div className="space-y-2">
          <Label>Bildformat</Label>
          <div className="relative">
            <div className="flex items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm">
              <span>Quadratisch (1:1)</span>
            </div>
          </div>
        </div>

        {/* Shot Type */}
        <div className="space-y-2">
          <Label>Aufnahme-Typ</Label>
           <div className="relative">
            <div className="flex items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm">
              <span>Ganzkörper</span>
            </div>
          </div>
        </div>
      </div>

       {/* Quantity Slider */}
       <div className="space-y-4">
        <div className="flex items-center justify-between">
           <Label>Anzahl Bilder <span className="text-muted-foreground text-xs ml-2">(max 6 für Basic)</span></Label>
           <span className="text-sm text-muted-foreground">{imageCount[0]} / 40</span>
        </div>
        <Slider
          value={imageCount}
          onValueChange={setImageCount}
          max={40}
          step={1}
          className="[&>.range]:bg-red-500" // Customizing slider color to match screenshot
        />
      </div>

      {/* Custom Prompt */}
      <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/10">
         <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
           Custom Prompt verwenden
           <Lock className="h-3 w-3" />
         </div>
         <Switch disabled />
      </div>

       {/* Actions */}
       <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
         <Button variant="neon" className="w-full">
           + Bilder dazu generieren
         </Button>
         <Button variant="destructive" className="w-full bg-red-500 hover:bg-red-600">
           Neu generieren
         </Button>
         <Button variant="outline" className="w-full">
           Alle herunterladen
         </Button>
       </div>
    </div>
  )
}
