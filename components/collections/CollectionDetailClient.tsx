"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { ConfigurationPanel } from "@/components/avatar-creator/ConfigurationPanel"
import { generateImagesAction, deleteCollectionAction, getCollectionImagesAction, deleteCollectionImagesAction } from "@/app/actions/image-actions"
import { ImageGallery } from "@/components/avatar-creator/ImageGallery"
import { ImageGenerationConfig } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import JSZip from "jszip"

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

interface CollectionDetailClientProps {
  collection: any
  images: any[]
}

export function CollectionDetailClient({ collection, images: initialImages }: CollectionDetailClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // React Query for Images List
  const { data: images } = useQuery({
      queryKey: ['collection-images', collection.id],
      queryFn: () => getCollectionImagesAction(collection.id),
      initialData: initialImages,
      // Refetch every 3 seconds if any image in the list has a 'pending' status
      refetchInterval: (query) => {
          const hasPending = query.state.data?.some((img: any) => img.status === 'pending');
          return hasPending ? 3000 : false;
      }
  })

  // Image generation mutation
  const generateMutation = useMutation({
    mutationFn: async (data: ImageGenerationConfig) => {
      return await generateImagesAction({
        ...data,
        collectionId: collection.id
      })
    },
    onSuccess: () => {
      // Invalidate to fetch new pending images
      queryClient.invalidateQueries({ queryKey: ['collection-images', collection.id] })
    },
    onError: (error) => {
      console.error("Failed to generate:", error)
      alert("Fehler bei der Generierung")
    }
  })

  // Use mutation for delete
  const deleteMutation = useMutation({
    mutationFn: async () => {
       await deleteCollectionAction(collection.id);
    },
    onSuccess: () => {
       // Force a hard refresh or redirect to ensure list state is clean
       router.push("/collections");
       router.refresh();
    },
    onError: (error) => {
       console.error("Delete failed:", error);
       alert("Fehler beim Löschen");
    }
  })

  // Delete all images mutation
  const deleteAllImagesMutation = useMutation({
    mutationFn: async () => {
        await deleteCollectionImagesAction(collection.id)
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['collection-images', collection.id] })
    },
    onError: (error) => {
        console.error("Failed to delete all images:", error)
        alert("Fehler beim Löschen aller Bilder")
    }
  })
  
  // State for delete all dialog
  const [isDeleteAllOpen, setIsDeleteAllOpen] = React.useState(false)

  const [isDownloading, setIsDownloading] = React.useState(false)

  const handleDownloadAll = async () => {
      if (!images || images.length === 0) return
      setIsDownloading(true)
      
      try {
          const zip = new JSZip()
          const folder = zip.folder(collection.name || "collection")

          // Fetch all images
          const promises = images.map(async (img: any, index: number) => {
              try {
                  const response = await fetch(img.url)
                  const blob = await response.blob()
                  const fileName = `image-${index + 1}.png`
                  folder?.file(fileName, blob)
              } catch (err) {
                  console.error("Failed to fetch image for zip:", img.id, err)
              }
          })

          await Promise.all(promises)

          // Generate zip
          const content = await zip.generateAsync({ type: "blob" })
          
          // Trigger download
          const downloadUrl = window.URL.createObjectURL(content)
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = `${collection.name || "images"}.zip`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(downloadUrl)

      } catch (error) {
          console.error("Failed to create zip:", error)
          alert("Fehler beim Erstellen der ZIP-Datei")
      } finally {
          setIsDownloading(false)
      }
  }

  // Reset polling when new generation starts
  const handleGenerate = (data: ImageGenerationConfig) => {
    generateMutation.mutate(data);
  }

  return (
    <div className="space-y-8">
        
        {/* Header content */}
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <Link href="/collections" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2">
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zur Übersicht
                </Link>
                <h1 className="text-3xl font-bold text-white">{collection.name}</h1>
                <p className="text-gray-400">
                    {images?.length || 0} Bilder • {collection.type} • {collection.status}
                </p>
            </div>
            
            <div className="flex gap-2">
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
                        disabled={deleteMutation.isPending}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Shooting löschen
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
                    <AlertDialogHeader>
                    <AlertDialogTitle>Bist du sicher?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                        Diese Aktion kann nicht rückgängig gemacht werden. Alle generierten Bilder und das Shooting werden dauerhaft gelöscht.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white">Abbrechen</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={(e) => {
                            e.preventDefault();
                            deleteMutation.mutate();
                        }} 
                        className="bg-red-600 hover:bg-red-700 text-white border-none"
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? "Lösche..." : "Löschen bestätigen"}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            </div>


            {/* Delete All Images Dialog */}
            <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
                <AlertDialogContent className="bg-gray-900 border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Alle Bilder löschen?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                             Möchtest du wirklich alle generierten Bilder in diesem Shooting löschen? Das Shooting selbst bleibt erhalten.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white">Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                             onClick={(e) => {
                                 e.preventDefault()
                                 deleteAllImagesMutation.mutate()
                                 setIsDeleteAllOpen(false)
                             }}
                             className="bg-red-600 hover:bg-red-700 text-white border-none"
                             disabled={deleteAllImagesMutation.isPending}
                        >
                            {deleteAllImagesMutation.isPending ? "Lösche..." : "Alles Löschen"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>

        {/* Configuration Panel */}
        <div>
            <ConfigurationPanel 
                onGenerate={handleGenerate}
                onDownloadAll={handleDownloadAll}
                onDeleteAll={() => setIsDeleteAllOpen(true)}
                isPending={generateMutation.isPending || deleteAllImagesMutation.isPending || isDownloading}
                hasGeneratedImages={images && images.length > 0}
                collectionId={collection.id}
                initialValues={{
                    collectionName: collection.name,
                    customPrompt: collection.prompt || "",
                    shotType: collection.type as any,
                    // If we had stored other config, we would pass it here
                    imageCount: [1], 
                }}
            />
        </div>

        {/* Existing Images Grid */}
        <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-semibold mb-6">Generierte Bilder</h2>
            <ImageGallery 
                images={images || []} 
            />
        </div>

      </div>
  )
}
