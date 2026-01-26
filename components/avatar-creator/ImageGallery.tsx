"use client"

import * as React from "react"
import { Download, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteImageAction } from "@/app/actions/image-actions"
import { useRouter } from "next/navigation"
import { ImageCard } from "@/components/avatar-creator/ImageCard"
import { ImagePreview } from "@/components/avatar-creator/ImagePreview"
import { PreviewPanelLayout } from "@/components/avatar-creator/PreviewPanelLayout"
import { VideoPromptPanel } from "@/components/avatar-creator/VideoPromptPanel"
import { ThumbnailStrip } from "@/components/avatar-creator/ThumbnailStrip"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useDownloadImage } from "@/hooks/use-download-image"
import { useVideoPrompts } from "@/hooks/use-video-prompts"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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

export function ImageGallery({ images = [] }: ImageGalleryProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [imageToDelete, setImageToDelete] = React.useState<Image | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentIndex, setCurrentIndex] = React.useState(0)

  // Panel state
  const [isPanelOpen, setIsPanelOpen] = React.useState(false)

  const downloadMutation = useDownloadImage()

  // Video prompts for badge indicator
  const currentImage = images[currentIndex]
  const { data: videoPrompts } = useVideoPrompts(currentImage?.id ?? null)
  const hasVideoPrompts = (videoPrompts?.length ?? 0) > 0

  const deleteMutation = useMutation({
    mutationFn: async (image: Image) => {
        await deleteImageAction(image.id, image.storage_path)
    },
    onSuccess: (data, variables) => {
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

  const confirmDelete = () => {
    if (!imageToDelete) return
    deleteMutation.mutate(imageToDelete)
  }

  const openGallery = (index: number) => {
      if (images[index]?.status === 'pending') return;
      setCurrentIndex(index)
      setIsOpen(true)
  }

  const handleDownload = (url: string, id: string) => {
      downloadMutation.mutate({ url, fileName: `image-${id}.png` })
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
    setIsPanelOpen(false)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
    setIsPanelOpen(false)
  }

  const handleThumbnailSelect = (index: number) => {
    setCurrentIndex(index)
    setIsPanelOpen(false)
  }

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious()
      } else if (e.key === "ArrowRight") {
        goToNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, images.length])

  if (images.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12 border border-dashed border-white/10 rounded-xl bg-muted/5">
        Noch keine Bilder in diesem Shooting.
      </div>
    )
  }

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
                showRetry={true}
              />
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="h-screen w-screen max-w-none sm:max-w-none p-0 border-none bg-transparent shadow-none flex flex-col items-center justify-center pointer-events-none" showCloseButton={false}>
             <div className="relative w-full h-full flex flex-col items-center justify-center p-2 md:p-4 pointer-events-auto">
                 <div className="relative w-full h-full max-w-[98vw] md:max-w-[95vw] max-h-[98vh] md:max-h-[95vh] bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">

                     {/* Header: Download (left), Counter (center), Delete + Close (right) */}
                     <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/40 z-20 shrink-0">
                         {/* Left: Download button */}
                         <div className="flex items-center">
                             {currentImage && (
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-white hover:bg-white/10"
                                    onClick={() => handleDownload(currentImage.url, currentImage.id)}
                                    disabled={downloadMutation.isPending}
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                             )}
                         </div>

                         {/* Center: Image counter */}
                         <span className="text-sm font-medium text-white">
                           {currentIndex + 1} / {images.length}
                         </span>

                         {/* Right: Delete + Close */}
                         <div className="flex items-center gap-2">
                             {currentImage && (
                                 <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                      onClick={(e) => {
                                          e.stopPropagation()
                                          setImageToDelete(currentImage)
                                      }}
                                      disabled={deleteMutation.isPending}
                                  >
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                             )}

                            <DialogClose asChild>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                              >
                                  <X className="h-4 w-4" />
                              </Button>
                            </DialogClose>
                         </div>
                     </div>

                     {/* Main content area with image and panel */}
                     <PreviewPanelLayout
                       isPanelOpen={isPanelOpen}
                       onPanelOpenChange={setIsPanelOpen}
                       panelContent={
                         <VideoPromptPanel imageId={currentImage?.id ?? null} />
                       }
                     >
                       <div className="flex-1 relative overflow-hidden bg-zinc-900">
                          {/* Main image display */}
                          <div className="w-full h-full flex items-center justify-center p-4">
                            <div className="relative w-full max-w-4xl aspect-square">
                              {currentImage && (
                                <ImagePreview
                                  image={currentImage}
                                  hasVideoPrompts={hasVideoPrompts}
                                  onVideoPromptClick={() => setIsPanelOpen(true)}
                                  isSelected={isPanelOpen}
                                  className="shadow-2xl"
                                />
                              )}
                            </div>
                          </div>

                          {/* Navigation arrows on image */}
                          {images.length > 1 && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/50 border border-white/10 text-white hover:bg-black/80 hover:text-white"
                                onClick={goToPrevious}
                              >
                                <ChevronLeft className="h-6 w-6" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/50 border border-white/10 text-white hover:bg-black/80 hover:text-white"
                                onClick={goToNext}
                              >
                                <ChevronRight className="h-6 w-6" />
                              </Button>
                            </>
                          )}
                       </div>
                     </PreviewPanelLayout>

                     {/* Thumbnail strip at bottom */}
                     {images.length > 1 && (
                       <ThumbnailStrip
                         images={images}
                         currentIndex={currentIndex}
                         onSelect={handleThumbnailSelect}
                       />
                     )}
                 </div>
                 <DialogTitle className="sr-only">Bild Detailansicht</DialogTitle>
             </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
