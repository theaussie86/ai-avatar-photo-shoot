"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Lock, Upload, Image as ImageIcon, Camera, X, RotateCcw } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
// We import types and schema. Zod schema is used with zodResolver
import { ImageGenerationSchema, type ImageGenerationConfig, ASPECT_RATIOS, SHOT_TYPES, GENERATION_MODELS, AspectRatioType, ShotType, GenerationModel } from "@/lib/schemas"
import { createClient } from "@/lib/supabase/client"
import { useMutation } from "@tanstack/react-query"
import { v4 as uuidv4 } from 'uuid';
import { saveImages, loadImages, clearImages, saveConfig, loadConfig, clearConfig } from "@/lib/image-persistence"
// React Hook Form imports
import { useForm, Controller, type SubmitHandler, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DevTool } from '@hookform/devtools'
import { toast } from "sonner"

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
    const [isLoaded, setIsLoaded] = React.useState(false)

    // Local state for the "Use Custom Prompt" switch
    const [showCustomPrompt, setShowCustomPrompt] = React.useState(!!initialValues?.customPrompt)

    // Local state for tracking Files to upload
    // Structure: { url: string, file?: File }
    const [localImages, setLocalImages] = React.useState<{ url: string, file?: File }[]>(
        (initialValues?.referenceImages || []).map(url => ({ url }))
    );

    const fileInputRef = React.useRef<HTMLInputElement>(null)
    
    // We keep file objects in local state because they are not serializable 
    // and maintaining them in RHF state alongside URLs can be tricky if we want to match the schema strictly (array of strings).
    // So we'll use a hybrid approach:
    // - RHF manages `referenceImages` (array of strings - existing URLs or blob URLs)
    // - We track `images` locally to hold the File objects corresponding to blob URLs.
    
    const form = useForm<ImageGenerationConfig>({
        // Cast to any to avoid strict type mismatch with Zod defaults vs RHF internal types
        resolver: zodResolver(ImageGenerationSchema) as any,
        defaultValues: {
            imageCount: initialValues?.imageCount || [1],
            referenceImages: initialValues?.referenceImages || [],
            background: initialValues?.background || "white",
            backgroundPrompt: initialValues?.backgroundPrompt || "",
            aspectRatio: (initialValues?.aspectRatio || "Auto") as AspectRatioType,
            shotType: (initialValues?.shotType || "full_body") as ShotType,
            customPrompt: initialValues?.customPrompt || "",
            collectionName: initialValues?.collectionName || "",
            collectionId: collectionId,
            tempStorageId: initialValues?.tempStorageId || undefined,
            model: (initialValues?.model ?? "gemini-2.5-flash-image") as GenerationModel,
        }
    })

    const { 
        control, 
        handleSubmit, 
        setValue, 
        watch, 
        reset,
        formState: { errors, isSubmitting } 
    } = form

    // Sync RHF with local images
    React.useEffect(() => {
        setValue('referenceImages', localImages.map(i => i.url), { shouldValidate: true });
    }, [localImages, setValue]);

    // Load from IndexedDB on mount
    React.useEffect(() => {
        const load = async () => {
            // 1. Config
            try {
                const savedConfig = await loadConfig()
                if (savedConfig) {
                     // specific Reset to ensure we don't overwrite crucial props like collectionId if needed, 
                    // but usually user config overrides defaults.
                    // We merge with initial default values to ensure all fields exist
                    reset({ ...savedConfig, collectionId }) 
                    
                    // If custom prompt was saved, ensure toggle is on
                    if (savedConfig.customPrompt) setShowCustomPrompt(true)
                }
            } catch (e) {
                console.error("Failed to load config from DB", e)
            }

            // 2. Images
            try {
                const files = await loadImages()
                if (files && files.length > 0) {
                    const imagesWithUrls = files.map(file => ({
                        url: URL.createObjectURL(file), // Create new blob URL for the session
                        file
                    }))
                    setLocalImages(imagesWithUrls)
                    // Trigger RHF update handles validation
                    setValue('referenceImages', imagesWithUrls.map(i => i.url), { shouldValidate: true }) 
                }
            } catch (e) {
                console.error("Failed to load images from DB", e)
            }
            
            setIsLoaded(true)
        }
        load()
    }, [reset, collectionId, setValue])

    // Watch values for conditional rendering and persistence
    const watchBackground = watch("background")
    const watchShowCustomPrompt = watch("customPrompt") // logic handled slightly differently below
    
    // Subscribe to changes and save to IndexedDB
    React.useEffect(() => {
        if (!isLoaded) return

        const subscription = watch(async (value) => {
            const { referenceImages, collectionId, tempStorageId, ...configToSave } = value
            await saveConfig(configToSave)
        })
        return () => subscription.unsubscribe()
    }, [watch, isLoaded])

    // Save images to IndexedDB whenever they change
    React.useEffect(() => {
        if (!isLoaded) return
        
        const save = async () => {
            const filesToSave = localImages.map(img => img.file).filter((f): f is File => !!f)
            await saveImages(filesToSave)
        }
        // Debounce slightly or just save? Saving images might be heavy if done too often, 
        // but user interaction is slow (adding one by one).
        const timer = setTimeout(save, 500)
        return () => clearTimeout(timer)
    }, [localImages, isLoaded])

    // Handle Reset
    const handleReset = async () => {
        // Confirmation is now handled by AlertDialog
        await clearConfig()
        await clearImages()
        
        const defaults = {
            imageCount: [1],
            referenceImages: [],
            background: "white",
            backgroundPrompt: "",
            aspectRatio: "Auto",
            shotType: "full_body",
            customPrompt: "",
            collectionName: "",
            collectionId: collectionId, // preserve collectionId
            tempStorageId: undefined,
            model: "gemini-2.5-flash-image",
        }
        // @ts-ignore
        reset(defaults)
        setLocalImages([])
        setShowCustomPrompt(false)
        toast.success("Einstellungen zurückgesetzt")
    }
    


    const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (localImages.length >= 3) return;
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setLocalImages(prev => [...prev, { url, file }]);
            e.target.value = ''; // reset
        }
    };

    const handleRemove = (index: number) => {
        setLocalImages(prev => prev.filter((_, i) => i !== index));
    };

    // Mutation for generation process
    const { mutate: runGeneration, isPending: isMutationPending } = useMutation({
        mutationFn: async (values: ImageGenerationConfig) => {
             const supabase = createClient();
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) throw new Error("Bitte melde dich an.");

             // Prepare final list of URLs (uploading new files if needed)
             const finalUrls: string[] = [];

             // Iterate over our local images to find ones that need uploading
             // We can match them by URL (blob url) stored in `values.referenceImages`?
             // Actually `values.referenceImages` comes from RHF state, which is synced from `localImages`.
             // So `localImages` is the source of truth for Files.
             
             for (const img of localImages) {
                 if (img.file) {
                     // Upload
                     const fileExt = img.file.name.split('.').pop();
                     const fileName = `${uuidv4()}.${fileExt}`;
                     const sessionId = collectionId || uuidv4();
                     const filePath = `${user.id}/${sessionId}/${fileName}`;

                     const { error, data } = await supabase.storage
                        .from('uploaded_images')
                        .upload(filePath, img.file);
                    
                     if (error) throw new Error(`Upload failed for ${img.file.name}: ${error.message}`);
                     finalUrls.push(`uploaded_images/${data.path}`);
                 } else {
                     // Existing URL
                     finalUrls.push(img.url);
                 }
             }

             const payload: ImageGenerationConfig = {
                 ...values,
                 referenceImages: finalUrls,
                 // Ensure we only send custom prompts if relevant
                 customPrompt: showCustomPrompt ? values.customPrompt : undefined,
                 backgroundPrompt: values.background === 'custom' ? values.backgroundPrompt : undefined
             };

            if (!onGenerate) throw new Error("Generierungs-Funktion fehlt.");
            return await onGenerate(payload);
        },
        onSuccess: (result: any) => {
             if (!collectionId && result?.success && result?.collectionId) {
                toast.success("Bilder-Generierung gestartet!", {
                    description: "Du wirst weitergeleitet...",
                })
                router.push(`/collections/${result.collectionId}`);
            } else if (result?.success) {
                toast.success("Bilder erfolgreich eingereiht!");
            }
        },
        onError: (error) => {
             console.error("Generierung fehlgeschlagen:", error);
             toast.error("Ein Fehler ist aufgetreten", {
                 description: error instanceof Error ? error.message : "Unbekannter Fehler",
             });
        }
    });

    const onSubmit: SubmitHandler<ImageGenerationConfig> = (data) => {
        runGeneration(data);
    };

  return (
    <div className="space-y-8 p-6 rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl relative">
      {/* Loading Overlay or Disabled State */}
      {!isLoaded && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="text-white text-sm">Konfiguration wird geladen...</div>
          </div>
      )}

      <fieldset disabled={!isLoaded} className="space-y-8 contents">

      {/* Collection Name */}
       <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-medium text-gray-200">Name des Shootings <span className="text-red-500">*</span></Label>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="outline" 
                            className="h-8 gap-2 border-white/10 bg-transparent text-xs px-2 text-muted-foreground hover:bg-white/5 hover:text-white"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Reset Config</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Konfiguration zurücksetzen?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                                Möchtest du wirklich alle Einstellungen und Referenzbilder zurücksetzen? Das Formular wird geleert.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white">Abbrechen</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={(e) => {
                                    handleReset()
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white border-none"
                            >
                                Zurücksetzen
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            <Controller
                name="collectionName"
                control={control}
                render={({ field }) => (
                    <Input 
                        {...field}
                        placeholder="z.B. Cyberpunk Shooting, Business Headshots..." 
                        className={cn(
                            "bg-black/40 border-white/10 text-gray-200 placeholder:text-gray-500",
                            errors.collectionName && "border-red-500"
                        )}
                    />
                )}
            />
            {errors.collectionName && (
                <p className="text-sm text-red-500">{errors.collectionName.message}</p>
            )}
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
                {localImages.map((img, idx) => (
                    <div key={idx} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-purple-500/50 shadow-sm group">
                        <img src={img.url} alt={`Reference ${idx + 1}`} className="h-full w-full object-cover" />
                        <button 
                            type="button"
                            onClick={() => handleRemove(idx)} 
                            className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
                
                {localImages.length < 3 && (
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
                            onChange={handleFileAdd}
                        />
                    </div>
                )}
            </div>
             {errors.referenceImages && (
                 <p className="text-sm text-red-500">{errors.referenceImages.message}</p>
            )}
        </div>

      {/* Background */}
        <div className="space-y-4">
            <Label className="text-base font-medium text-gray-200">Hintergrund</Label>
            <Controller
                name="background"
                control={control}
                render={({ field }) => (
                    <div className="grid md:grid-cols-3 gap-2">
                        <Button 
                            type="button"
                            variant={field.value === "white" ? "default" : "outline"} 
                            className={cn(
                                "w-full justify-start border-0 ring-2 ring-white hover:bg-white/90",
                                field.value === "white" ? "bg-white text-black" : "bg-transparent text-white hover:bg-white/10"
                            )}
                            onClick={() => field.onChange("white")}
                        >
                            Weißer Hintergrund
                        </Button>
                        <Button 
                            type="button"
                            variant={field.value === "green" ? "default" : "outline"}
                            className={cn(
                            "w-full justify-start border-green-900/50 hover:bg-green-900/30",
                            "hover:text-green-500", // Fix hover text color
                            field.value === "green" ? "bg-green-900/40 text-green-400 border-green-500" : "bg-green-900/20 text-green-500"
                            )}
                            onClick={() => field.onChange("green")}
                        >
                            Greenscreen
                        </Button>
                        <Button 
                            type="button"
                            variant={field.value === "custom" ? "default" : "outline"}
                            className={cn(
                                "w-full justify-start hover:bg-muted/30",
                                field.value === "custom" ? "bg-muted/40 text-white border-white" : "bg-muted/20 text-muted-foreground"
                            )}
                            onClick={() => field.onChange("custom")}
                        >
                            Eigene Szenerie
                        </Button>
                    </div>
                )}
            />
            
            {watchBackground === "custom" && (
                 <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <Controller
                        name="backgroundPrompt"
                        control={control}
                        render={({ field }) => (
                            <Input 
                                {...field}
                                placeholder="Beschreibe den Hintergrund (z.B. am Strand, im Büro, Cyberpunk Stadt)..." 
                                className="bg-black/40 border-white/10 text-gray-200 placeholder:text-gray-500"
                            />
                        )}
                    />
                     {errors.backgroundPrompt && (
                        <p className="text-sm text-red-500">{errors.backgroundPrompt.message}</p>
                    )}
                </div>
            )}
        </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Aspect Ratio */}
        <div className="space-y-2">
            <Label className="text-gray-200">Bildformat</Label>
            <Controller
                name="aspectRatio"
                control={control}
                render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                )}
            />
        </div>

        {/* Shot Type */}
        <div className="space-y-2">
            <Label className="text-gray-200">Aufnahme-Typ</Label>
             <Controller
                name="shotType"
                control={control}
                render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                )}
            />
        </div>
      </div>

      {/* Model Selection */}
      <div className="space-y-4">
        <Label className="text-gray-200">KI Modell</Label>
         <Controller
            name="model"
            control={control}
            render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
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
            )}
        />
      </div>

       {/* Quantity Slider */}
        <div className="space-y-4">
             <Controller
                name="imageCount"
                control={control}
                render={({ field }) => (
                    <>
                        <div className="flex items-center justify-between">
                            <Label className="text-gray-200">Anzahl Bilder</Label>
                            <span className="text-sm font-medium text-gray-200">{field.value[0]} / 40</span>
                        </div>
                        <Slider
                            value={field.value}
                            onValueChange={field.onChange}
                            max={40}
                            min={1}
                            step={1}
                            className="[&_[data-slot=slider-track]]:bg-gray-800 [&_[data-slot=slider-range]]:bg-white" 
                        />
                    </>
                )}
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
               <Controller
                name="customPrompt"
                control={control}
                render={({ field }) => (
                    <Textarea 
                        {...field}
                        placeholder="Beschreibe deine Szene im Detail..." 
                        className="min-h-[100px] resize-none bg-black/40 border-white/10 text-gray-200 placeholder:text-gray-500"
                    />
                )}
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
             onClick={handleSubmit(onSubmit)}
              disabled={isPending || isMutationPending || isSubmitting}
            >
              {(isPending || isMutationPending || isSubmitting) ? "Generiere..." : "Bilder generieren"}
           </Button>
         ) : (
           <>
             <Button 
               variant="neon" 
               className="w-full" 
               onClick={handleSubmit(onSubmit)}
               disabled={isPending || isMutationPending || isSubmitting}
             >
               {(isPending || isMutationPending || isSubmitting) ? "Generiere..." : "+ Bilder dazu generieren"}
             </Button>
             <Button 
               type="button"
               variant="destructive" 
               className="w-full bg-red-500 hover:bg-red-600"
               onClick={onDeleteAll}
             >
               Alle Bilder löschen
             </Button>
             <Button 
                type="button"
                className="w-full bg-white text-black hover:bg-gray-200" 
                onClick={onDownloadAll}
            >
               Alle herunterladen
             </Button>
           </>
         )}
       </div>
       </fieldset>
       {/* {process.env.NODE_ENV === 'development' && <DevTool control={control} />} */}
    </div>
  )
}
