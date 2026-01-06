
"use client"

import * as React from "react"
import { Download, Trash2, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getImageAction, deleteImageAction, retriggerImageAction } from "@/app/actions/image-actions"
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
} from "@/components/ui/alert-dialog"

interface ImageCardProps {
  initialImage: any
  onClick: () => void
  showRetry?: boolean
}

export function ImageCard({ initialImage, onClick, showRetry }: ImageCardProps) {
  const queryClient = useQueryClient()
  const downloadMutation = useDownloadImage()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isTimedOut, setIsTimedOut] = React.useState(false) // Local timeout state
  const pollingAttempts = React.useRef(0)

  // Poll for image status if it's pending
  const { data: image } = useQuery({
    queryKey: ['image', initialImage.id],
    queryFn: () => getImageAction(initialImage.id),
    initialData: initialImage,
    staleTime: Infinity, // Trust initialData, don't refetch on mount
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status !== 'pending') return false

      if (pollingAttempts.current >= 5) {
         setIsTimedOut(true)
         return false
      }
      
      pollingAttempts.current++
      // Poll if pending. Add slight jitter to prevent thundering herd if multiple images pending
      return 2000 + Math.random() * 500
    },
    // If the image updates from pending to completed, invalidate the list to update carousel/parent
    // We can use the meta.persist option or useEffect. 
    // Using simple side effect in component specific to status change is easier.
  })

  // Effect to invalidate parent list when image completes
  React.useEffect(() => {
    if (image.status === 'completed' && initialImage.status === 'pending') {
         // Invalidate collection list so the parent (and carousel) gets the updated URL/status
         queryClient.invalidateQueries({ queryKey: ['collection-images', image.collection_id] })
    }
  }, [image.status, initialImage.status, image.collection_id, queryClient])

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
        await deleteImageAction(image.id, image.storage_path)
    },
    onSuccess: () => {
        // Update parent list
        queryClient.invalidateQueries({ queryKey: ['collection-images', image.collection_id] })
        setIsDeleteDialogOpen(false)
    },
    onError: (error) => {
        console.error("Failed to delete image:", error)
        alert("Fehler beim Löschen des Bildes")
    }
  })

  // Retrigger Mutation
  const retriggerMutation = useMutation({
    mutationFn: async () => {
        return await retriggerImageAction(image.id)
    },
    onSuccess: () => {
        // Reset polling state
        pollingAttempts.current = 0
        setIsTimedOut(false)

        // Invalidate self to start polling
        queryClient.invalidateQueries({ queryKey: ['image', image.id] })
        // Also invalidate list to show pending state if needed
        queryClient.invalidateQueries({ queryKey: ['collection-images', image.collection_id] })
    },
    onError: (error) => {
        console.error("Failed to retrigger:", error)
        alert("Neustart fehlgeschlagen")
    }
  })

  const handleDownload = (e: React.MouseEvent) => {
      e.stopPropagation()
      downloadMutation.mutate({ url: image.url, fileName: `image-${image.id}.png` })
  }

  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsDeleteDialogOpen(true)
  }

  const handleRetrigger = (e: React.MouseEvent) => {
      e.stopPropagation()
      retriggerMutation.mutate()
  }

  return (
    <>
      <div 
        className={`group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-muted/10 ${image.status === 'pending' ? 'cursor-wait' : 'cursor-zoom-in'}`}
        onClick={onClick}
      >
        {image.status === 'pending' ? (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gray-900/50 p-4 text-center">
                {showRetry || isTimedOut || image.status === 'failed' ? ( 
                     // Show retry if global showRetry is on, OR local timeout, OR status failed
                     <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-red-400 font-medium">
                            {image.status === 'failed' ? 'Fehlgeschlagen' : 'Zeitüberschreitung'}
                        </span>
                        <Button 
                            size="sm" 
                            variant="outline"
                            className="bg-white/5 border-white/20 hover:bg-white/20 text-xs h-8"
                            onClick={handleRetrigger}
                            disabled={retriggerMutation.isPending}
                        >
                            <RefreshCw className={`w-3 h-3 mr-1.5 ${retriggerMutation.isPending ? 'animate-spin' : ''}`} />
                            Erneut versuchen
                        </Button>
                    </div>
                ) : (
                    <>
                        <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
                        <span className="text-xs text-gray-400 animate-pulse">Wird generiert...</span>
                    </>
                )}
            </div>
        ) : (
            <>
                <img 
                  src={image.url} 
                  alt={`Generated`} 
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-mono text-white/70 bg-black/40 px-1.5 py-0.5 rounded">
                      ID: {image.id.slice(0, 4)}
                    </span>
                    {/* Delete Button */}
                    <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-600 rounded-full"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex justify-end gap-2">
                    {/* Retrigger Button (if needed for completed images? Usually not, but if user wants to regen specific seed?) 
                        Actually user requirement: "Retriggering ... on a per image basis".
                        This usually implies failed or stuck images. 
                        But maybe they want to redo a specific slot?
                        For now, let's keep retrigger for failed, but we can enable it maybe?
                        The UI in ImageGallery only showed retrigger for pending/timeout.
                    */}
                    {/* Download Button */}
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-black border-none"
                        onClick={handleDownload}
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
            </>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
                    deleteMutation.mutate()
                }}
                className="bg-red-600 hover:bg-red-700 text-white border-none"
                disabled={deleteMutation.isPending}
            >
                {deleteMutation.isPending ? "Lösche..." : "Löschen"}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
