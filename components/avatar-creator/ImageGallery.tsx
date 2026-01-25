"use client"

import * as React from "react"
import { Download, Trash2, Maximize2, X, Search, ZoomIn, ZoomOut, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteImageAction } from "@/app/actions/image-actions"
import { useRouter } from "next/navigation"
import { ImageCard } from "@/components/avatar-creator/ImageCard"
import { ImagePreview } from "@/components/avatar-creator/ImagePreview"
import { PreviewPanelLayout } from "@/components/avatar-creator/PreviewPanelLayout"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useDownloadImage } from "@/hooks/use-download-image"

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
import { toast } from "sonner"

interface Image {
  id: string
  url: string
  storage_path: string
  created_at?: string
  status?: string
  collection_id?: string
}

interface ImageGalleryProps {
  images?: Image[]
  showRetry?: boolean
  onRetrigger?: (id: string) => void
}

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"

export function ImageGallery({ images = [] }: ImageGalleryProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [imageToDelete, setImageToDelete] = React.useState<Image | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const [initialIndex, setInitialIndex] = React.useState(0)
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)

  // Panel state
  const [isPanelOpen, setIsPanelOpen] = React.useState(false)

  // Zoom state
  const [zoomLevel, setZoomLevel] = React.useState(1)
  const MAX_ZOOM = 3
  const MIN_ZOOM = 0.5
  const STEP = 0.25

  const downloadMutation = useDownloadImage()

  const deleteMutation = useMutation({
    mutationFn: async (image: Image) => {
        await deleteImageAction(image.id, image.storage_path)
    },
    onSuccess: (data, variables) => {
        // Invalidate the collection list using the collection_id from the deleted image
        // Assuming images have collection_id. If not, we might need to rely on parent re-rendering.
        // But better to invalidate if we can.
        if (variables.collection_id) {
            queryClient.invalidateQueries({ queryKey: ['collection-images', variables.collection_id] })
        } else {
             router.refresh()
        }
        toast.success("Bild gelöscht")
        setImageToDelete(null)
    },
    onError: (error) => {
        console.error("Failed to delete image:", error)
        toast.error("Fehler beim Löschen des Bildes")
    }
  })

  // Update current index when api changes
  React.useEffect(() => {
    if (!api) {
      return
    }

    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
      setZoomLevel(1) // Reset zoom on slide change
      setIsPanelOpen(false) // Close panel on slide change
    })
  }, [api])

  // Scroll to initial index when opening
  React.useEffect(() => {
     if (isOpen && api) {
       api.scrollTo(initialIndex, true)
     }
  }, [isOpen, api, initialIndex])


  const confirmDelete = () => {
    if (!imageToDelete) return
    deleteMutation.mutate(imageToDelete)
  }

  const zoomIn = (e: React.MouseEvent) => {
    e.stopPropagation()
    setZoomLevel(prev => Math.min(prev + STEP, MAX_ZOOM))
  }

  const zoomOut = (e: React.MouseEvent) => {
    e.stopPropagation()
    setZoomLevel(prev => Math.max(prev - STEP, MIN_ZOOM))
  }
  
  const resetZoom = (e: React.MouseEvent) => {
    e.stopPropagation()
    setZoomLevel(1)
  }

  const openGallery = (index: number) => {
      if (images[index]?.status === 'pending') return;
      setInitialIndex(index)
      setIsOpen(true)
  }

  const handleDownload = (url: string, id: string) => {
      downloadMutation.mutate({ url, fileName: `image-${id}.png` })
  }

  if (images.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12 border border-dashed border-white/10 rounded-xl bg-muted/5">
        Noch keine Bilder in diesem Shooting.
      </div>
    )
  }
  
  const currentImage = images[current]

  return (
    <>
      <AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Bild löschen?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Möchtest du dieses Bild wirklich unwiderruflich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white">Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                  e.preventDefault()
                  confirmDelete()
              }}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Lösche..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, idx) => (
              <ImageCard 
                key={img.id}
                initialImage={img}
                onClick={() => openGallery(idx)}
                showRetry={true} // Always allow retry for failed/stuck images
              />
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="h-screen p-0 border-none bg-transparent shadow-none flex flex-col items-center justify-center pointer-events-none">
             {/* 
                We use pointer-events-none on the container and pointer-events-auto on the content 
                to allow clicks to pass through to the backdrop for closing 
             */}
             <div className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8 pointer-events-auto">
                 {/* Card Container for Image */}
                 <div className="relative w-full h-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                     
                     {/* Toolbar */}
                     <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/40 z-20 shrink-0">
                         <div className="flex items-center gap-2">
                             <span className="text-sm font-semibold text-white px-2">Bild #{current + 1} / {images.length}</span>
                             <div className="h-4 w-px bg-white/10 mx-1"></div>
                             <span className="text-xs text-gray-400 font-mono">{Math.round(zoomLevel * 100)}%</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={zoomOut} disabled={zoomLevel <= MIN_ZOOM}>
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10 font-mono text-xs" onClick={resetZoom}>
                                {Math.round(zoomLevel * 100)}%
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={zoomIn} disabled={zoomLevel >= MAX_ZOOM}>
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                            
                             <div className="h-4 w-px bg-white/10 mx-2"></div>
                             
                             {currentImage && (
                                <>
                                 <Button
                                      variant="destructive"
                                      size="icon"
                                      className="h-8 w-8 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                                      onClick={(e) => {
                                          e.stopPropagation()
                                          setImageToDelete(currentImage)
                                      }}
                                      disabled={deleteMutation.isPending}
                                  >
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                                 
                                 <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 bg-white/10 text-white hover:bg-white hover:text-black"
                                    onClick={() => handleDownload(currentImage.url, currentImage.id)}
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                                </>
                             )}

                            <DialogClose asChild>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 ml-2"
                              >
                                  <X className="h-4 w-4" />
                              </Button>
                            </DialogClose>
                         </div>
                     </div>

                     {/* Carousel Viewport with Panel Layout */}
                     <PreviewPanelLayout
                       isPanelOpen={isPanelOpen}
                       onPanelOpenChange={setIsPanelOpen}
                       panelContent={
                         <div className="flex flex-col h-full">
                           <h3 className="text-xl font-semibold text-white mb-4">Video Prompt</h3>
                           <p className="text-gray-400">Panel content (Phase 4)</p>
                           <div className="mt-4 text-xs text-gray-500">
                             Image: {currentImage?.id}
                           </div>
                         </div>
                       }
                     >
                       <div className="flex-1 relative overflow-hidden bg-zinc-900">
                          <Carousel setApi={setApi} className="w-full h-full">
                              <CarouselContent className="h-full ml-0">
                                  {images.map((img, idx) => (
                                      <CarouselItem key={img.id} className="h-full pl-0 relative">
                                          {/* Image Container with Zoom */}
                                           <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                                               <div
                                                  className="relative w-full max-w-4xl aspect-square origin-center transition-transform duration-200"
                                                  style={{
                                                      transform: `scale(${zoomLevel})`,
                                                  }}
                                               >
                                                  <ImagePreview
                                                    image={img}
                                                    hasVideoPrompts={false}
                                                    onVideoPromptClick={() => setIsPanelOpen(true)}
                                                    isSelected={isPanelOpen && idx === current}
                                                    className="shadow-2xl"
                                                  />
                                               </div>
                                           </div>
                                      </CarouselItem>
                                  ))}
                              </CarouselContent>
                              <CarouselPrevious className="left-4 bg-black/50 border-white/10 text-white hover:bg-black/80" />
                              <CarouselNext className="right-4 bg-black/50 border-white/10 text-white hover:bg-black/80" />
                          </Carousel>
                       </div>
                     </PreviewPanelLayout>
                 </div>
                 <DialogTitle className="sr-only">Bild Detailansicht</DialogTitle>
             </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
