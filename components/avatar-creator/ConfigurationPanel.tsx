"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Lock, Upload, Image as ImageIcon, Camera, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ImageGenerationSchema, ImageGenerationConfig, ASPECT_RATIOS, SHOT_TYPES, GENERATION_MODELS, AspectRatioType, ShotType, GenerationModel } from "@/lib/schemas"
import { createClient } from "@/lib/supabase/client"
import { uploadReferenceImage } from "@/app/actions/image-actions"
import { useMutation } from "@tanstack/react-query"

interface ConfigurationPanelProps {
  hasGeneratedImages?: boolean;
  onGenerate?: (data: ImageGenerationConfig) => void;
  onDeleteAll?: () => void;
  onDownloadAll?: () => void;
  isPending?: boolean;
  collectionId?: string;
  initialValues?: Partial<ImageGenerationConfig>;
}

export function ConfigurationPanel({ 
  hasGeneratedImages = false, 
  onGenerate, 
  onDeleteAll, 
  onDownloadAll,
  isPending = false,
  collectionId,
  initialValues
}: ConfigurationPanelProps) {
    const router = useRouter()
    const [imageCount, setImageCount] = React.useState(initialValues?.imageCount || [1])
    const [referenceImages, setReferenceImages] = React.useState<string[]>(initialValues?.referenceImages || [])
    const [referenceFiles, setReferenceFiles] = React.useState<File[]>([])
    const [background, setBackground] = React.useState<"white" | "green" | "custom">(initialValues?.background || "white")
    const [backgroundPrompt, setBackgroundPrompt] = React.useState(initialValues?.backgroundPrompt || "")
    
    // Updated aspect ratios including Auto
    const [aspectRatio, setAspectRatio] = React.useState<AspectRatioType>(initialValues?.aspectRatio as AspectRatioType || "Auto")
    const [shotType, setShotType] = React.useState<ShotType>(initialValues?.shotType as ShotType || "full_body")
    
    // Custom Prompt State
    const [showCustomPrompt, setShowCustomPrompt] = React.useState(!!initialValues?.customPrompt)
    const [customPrompt, setCustomPrompt] = React.useState(initialValues?.customPrompt || "")
    const [collectionName, setCollectionName] = React.useState(initialValues?.collectionName || "")
    const [model, setModel] = React.useState<GenerationModel>(initialValues?.model || "gemini-2.5-flash-image")
    
    const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (referenceImages.length >= 3) return;
      
      const file = e.target.files[0]
      const imageUrl = URL.createObjectURL(file)
      setReferenceImages([...referenceImages, imageUrl])
      setReferenceFiles([...referenceFiles, file])
      
      // Reset input so same file can be selected again if needed
      e.target.value = ''
    }
  }



  const removeImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index))
    setReferenceFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Mutation for generation process
  const { mutate: generateImages, isPending: isGenerating } = useMutation({
    mutationFn: async () => {
        // 1. Upload reference images (if any)
        const uploadedImageUris: string[] = [];
        const supabase = createClient();
        
        // Get current user for folder path validation
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Bitte melde dich an.");

        if (referenceFiles.length > 0) {
             const uploadPromises = referenceFiles.map(async (file) => {
                 const formData = new FormData();
                 formData.append("file", file);
                 const result = await uploadReferenceImage(formData);
                 return result.uri;
             });
             const uris = await Promise.all(uploadPromises);
             uploadedImageUris.push(...uris);
        }

        const finalReferenceImages = uploadedImageUris;

        const data: ImageGenerationConfig = {
            imageCount,
            referenceImages: finalReferenceImages,
            background: background as any,
            backgroundPrompt: background === 'custom' ? backgroundPrompt : undefined,
            aspectRatio: aspectRatio as any,
            shotType: shotType as any,
            customPrompt: showCustomPrompt ? customPrompt : undefined,
            collectionName,
            collectionId,
            model
        };

        // Validate
        const validation = ImageGenerationSchema.safeParse(data);
        if (!validation.success) {
            throw new Error("Bitte überprüfe deine Eingaben: " + validation.error.message);
        }

        // Call Server Action
        if (!onGenerate) throw new Error("Keine Generierungs-Funktion verfügbar.");
        
        // Return the result from the server action
        // We cast to any because the prop definition might be void, but we know the action returns data
        return await (onGenerate as any)(validation.data);
    },
    onSuccess: (result: any) => {
        if (!collectionId && result?.success && result?.collectionId) {
            router.push(`/collections/${result.collectionId}`);
        }
    },
    onError: (error) => {
        console.error("Generation failed:", error);
        alert(error instanceof Error ? error.message : "Fehler bei der Generierung.");
    }
  });

  const handleGenerateClick = () => {
      generateImages();
  };

  return (
    <div className="space-y-8 p-6 rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl">
      
      <div className="space-y-4">
        <Label className="text-base font-medium text-gray-200">Name des Shootings <span className="text-red-500">*</span></Label>
        <Input 
          placeholder="z.B. Cyberpunk Shooting, Business Headshots..." 
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
          className="bg-black/40 border-white/10 text-gray-200 placeholder:text-gray-500"
        />
      </div>

      {/* Reference Images */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium text-gray-200">Referenzbilder</Label>
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
        <Label className="text-base font-medium text-gray-200">Hintergrund</Label>
        <div className="grid md:grid-cols-3 gap-2">
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
          <Button 
            variant={background === "custom" ? "default" : "outline"}
            className={cn(
                "w-full justify-start hover:bg-muted/30",
                background === "custom" ? "bg-muted/40 text-white border-white" : "bg-muted/20 text-muted-foreground"
            )}
            onClick={() => setBackground("custom")}
            >
                Eigene Szenerie
            </Button>
        </div>
        
        {/* Custom Background Input */}
        {background === "custom" && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <Input 
                    placeholder="Beschreibe den Hintergrund (z.B. am Strand, im Büro, Cyberpunk Stadt)..." 
                    className="bg-black/40 border-white/10 text-gray-200 placeholder:text-gray-500"
                    value={backgroundPrompt}
                    onChange={(e) => setBackgroundPrompt(e.target.value)}
                />
            </div>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Aspect Ratio */}
        <div className="space-y-2">
          <Label className="text-gray-200">Bildformat</Label>
          <Select value={aspectRatio} onValueChange={(val) => setAspectRatio(val as any)}>
            <SelectTrigger className="w-full text-gray-200 bg-black/40 border-white/10">
              <SelectValue placeholder="Wähle Format" />
            </SelectTrigger>
            <SelectContent>
              {ASPECT_RATIOS.map((ratio) => (
                <SelectItem key={ratio} value={ratio}>
                   {ratio === 'Auto' ? 'Automatisch (Auto)' : 
                    ratio === '1:1' ? 'Quadratisch (1:1)' :
                    ratio === '9:16' ? 'Mobile (9:16)' :
                    ratio === '16:9' ? 'Widescreen (16:9)' :
                    ratio === '3:4' ? 'Foto Hochformat (3:4)' :
                    ratio === '4:3' ? 'Foto Querformat (4:3)' :
                    ratio === '3:2' ? 'Klassisch (3:2)' :
                    ratio === '2:3' ? 'Portrait (2:3)' :
                    ratio === '5:4' ? 'Mittelformat (5:4)' :
                    ratio === '4:5' ? 'Instagram (4:5)' :
                    ratio === '21:9' ? 'Ultra-Breit (21:9)' : ratio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Shot Type */}
        <div className="space-y-2">
          <Label className="text-gray-200">Aufnahme-Typ</Label>
          <Select value={shotType} onValueChange={(val) => setShotType(val as any)}>
            <SelectTrigger className="w-full text-gray-200 bg-black/40 border-white/10">
              <SelectValue placeholder="Wähle Aufnahme" />
            </SelectTrigger>
            <SelectContent>
              {SHOT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'full_body' ? 'Ganzkörper' : 
                   type === 'upper_body' ? 'Oberkörper' : 
                   type === 'face' ? 'Nahaufnahme Gesicht' : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Model Selection */}
      <div className="space-y-4">
        <Label className="text-gray-200">KI Modell</Label>
        <Select value={model} onValueChange={(val) => setModel(val as GenerationModel)}>
          <SelectTrigger className="w-full text-gray-200 bg-black/40 border-white/10">
            <SelectValue placeholder="Wähle Modell" />
          </SelectTrigger>
          <SelectContent>
            {GENERATION_MODELS.map((m) => (
              <SelectItem key={m} value={m}>
                {m.split('/').pop()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

       {/* Quantity Slider */}
       <div className="space-y-4">
       <div className="flex items-center justify-between">
            <Label className="text-gray-200">Anzahl Bilder</Label>
            <span className="text-sm font-medium text-gray-200">{imageCount[0]} / 40</span>
         </div>
        <Slider
          value={imageCount}
          onValueChange={setImageCount}
          max={40}
          min={1}
          step={1}
          className="[&_[data-slot=slider-track]]:bg-gray-800 [&_[data-slot=slider-range]]:bg-white" 
        />
      </div>

      {/* Custom Prompt */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/10">
           <div className="flex items-center gap-2 text-sm font-medium text-gray-200 flex-1">
             Custom Prompt verwenden
           </div>
           <Switch checked={showCustomPrompt} onCheckedChange={setShowCustomPrompt} />
        </div>
        
        {showCustomPrompt && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
             <Textarea 
                placeholder="Beschreibe deine Szene im Detail..." 
                className="min-h-[100px] resize-none bg-black/40 border-white/10 text-gray-200 placeholder:text-gray-500"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
             />
          </div>
        )}
      </div>

       {/* Actions */}
       <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
         {!hasGeneratedImages ? (
           <Button 
             variant="neon" 
             className="w-full col-span-full" 
             onClick={handleGenerateClick}
              disabled={isPending || isGenerating}
            >
              {(isPending || isGenerating) ? "Generiere..." : "Bilder generieren"}
           </Button>
         ) : (
           <>
             <Button 
               variant="neon" 
               className="w-full" 
               onClick={handleGenerateClick}
               disabled={isPending || isGenerating}
             >
               {(isPending || isGenerating) ? "Generiere..." : "+ Bilder dazu generieren"}
             </Button>
             <Button 
               variant="destructive" 
               className="w-full bg-red-500 hover:bg-red-600"
               onClick={onDeleteAll}
             >
               Alle Bilder löschen
             </Button>
             <Button className="w-full bg-white text-black hover:bg-gray-200" onClick={onDownloadAll}>
               Alle herunterladen
             </Button>
           </>
         )}
       </div>
    </div>
  )
}
