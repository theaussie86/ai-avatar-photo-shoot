"use client"

import * as React from "react"
import { Lock, Upload, Image as ImageIcon, Camera, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export function ConfigurationPanel() {
  const [imageCount, setImageCount] = React.useState([1])
  const [referenceImages, setReferenceImages] = React.useState<string[]>([])
  const [background, setBackground] = React.useState<"white" | "green" | "custom">("white")
  const [customBgImage, setCustomBgImage] = React.useState<string | null>(null)
  
  const [aspectRatio, setAspectRatio] = React.useState("1:1")
  const [shotType, setShotType] = React.useState("Ganzkörper")
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const customBgInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (referenceImages.length >= 3) return;
      
      const file = e.target.files[0]
      const imageUrl = URL.createObjectURL(file)
      setReferenceImages([...referenceImages, imageUrl])
      
      // Reset input so same file can be selected again if needed
      e.target.value = ''
    }
  }

  const handleCustomBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const imageUrl = URL.createObjectURL(file)
      setCustomBgImage(imageUrl)
      setBackground("custom")
    }
  }

  const removeImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-8 p-6 rounded-xl border bg-card/50 backdrop-blur-sm">
      
      {/* Reference Images */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Referenzbilder</Label>
          <div className="flex gap-1 text-muted-foreground">
             <div className="h-2 w-2 rounded-full bg-purple-500" />
          </div>
        </div>
        
        <div className="flex gap-3">
           {/* Render Uploaded Images */}
           {referenceImages.map((img, idx) => (
             <div key={idx} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-purple-500/50 shadow-sm group">
               <img src={img} alt={`Reference ${idx + 1}`} className="h-full w-full object-cover" />
               <button 
                 onClick={() => removeImage(idx)} 
                 className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500"
               >
                  <X className="h-3 w-3" />
               </button>
             </div>
           ))}
           
           {/* Upload Button Placeholder (Only if < 3 images) */}
           {referenceImages.length < 3 && (
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer hover:bg-muted/10"
             >
               <Upload className="h-6 w-6 text-muted-foreground" />
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*"
                 onChange={handleFileChange}
               />
             </div>
           )}
        </div>
      </div>

      {/* Background */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Hintergrund</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant={background === "white" ? "default" : "outline"} 
            className={cn(
               "w-full justify-start border-0 ring-2 ring-white hover:bg-white/90",
               background === "white" ? "bg-white text-black" : "bg-transparent text-white hover:bg-white/10"
            )}
            onClick={() => setBackground("white")}
          >
             Weißer Hintergrund
          </Button>
          <Button 
            variant={background === "green" ? "default" : "outline"}
            className={cn(
              "w-full justify-start border-green-900/50 hover:bg-green-900/30",
              background === "green" ? "bg-green-900/40 text-green-400 border-green-500" : "bg-green-900/20 text-green-500"
            )}
            onClick={() => setBackground("green")}
          >
             Greenscreen
          </Button>
          <div className="w-full relative">
             <Button 
               variant={background === "custom" ? "default" : "outline"}
               className={cn(
                 "w-full justify-start hover:bg-muted/30",
                 background === "custom" ? "bg-muted/40 text-white border-white" : "bg-muted/20 text-muted-foreground"
               )}
               onClick={() => customBgInputRef.current?.click()}
             >
                {customBgImage ? "Bild ändern" : "Eigene Szenerie"}
             </Button>
             <input 
               type="file" 
               ref={customBgInputRef} 
               className="hidden" 
               accept="image/*" 
               onChange={handleCustomBgChange}
             />
          </div>
        </div>
        
        {/* Custom Background Preview */}
        {background === "custom" && customBgImage && (
           <div className="relative h-32 w-full overflow-hidden rounded-lg border border-muted-foreground/20">
              <img src={customBgImage} alt="Custom Background" className="h-full w-full object-cover" />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 h-6 w-6"
                onClick={() => {
                   setCustomBgImage(null)
                   setBackground("white")
                }}
              >
                <X className="h-3 w-3" />
              </Button>
           </div>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Aspect Ratio */}
        <div className="space-y-2">
          <Label>Bildformat</Label>
          <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Wähle Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1:1">Quadratisch (1:1)</SelectItem>
              <SelectItem value="9:16">Mobile (9:16)</SelectItem>
              <SelectItem value="4:5">Instagram (4:5)</SelectItem>
              <SelectItem value="3:4">Foto Hochformat (3:4)</SelectItem>
              <SelectItem value="4:3">Foto Querformat (4:3)</SelectItem>
              <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
              <SelectItem value="21:9">Ultra-Breit (21:9)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Shot Type */}
        <div className="space-y-2">
          <Label>Aufnahme-Typ</Label>
          <Select value={shotType} onValueChange={setShotType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Wähle Aufnahme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ganzkörper">Ganzkörper</SelectItem>
              <SelectItem value="Oberkörper">Oberkörper</SelectItem>
              <SelectItem value="Nahaufnahme Gesicht">Nahaufnahme Gesicht</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

       {/* Quantity Slider */}
       <div className="space-y-4">
        <div className="flex items-center justify-between">
           <Label>Anzahl Bilder</Label>
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
         <div className="flex items-center gap-2 text-sm font-medium text-foreground">
           Custom Prompt verwenden
         </div>
         <Switch />
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
