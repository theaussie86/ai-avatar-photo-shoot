"use client"

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, RefreshCw, Trash2 } from "lucide-react"
import Link from "next/link"
import { ConfigurationPanel } from "@/components/avatar-creator/ConfigurationPanel"
import { generateImagesAction, deleteCollectionAction } from "@/app/actions/image-actions"
import { ImageGallery } from "@/components/avatar-creator/ImageGallery"
import { ImageGenerationConfig } from "@/lib/schemas"
import { Button } from "@/components/ui/button"

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

export function CollectionDetailClient({ collection, images }: CollectionDetailClientProps) {
  const router = useRouter()
  // Image generation mutation
  const generateMutation = useMutation({
    mutationFn: async (data: ImageGenerationConfig) => {
      return await generateImagesAction({
        ...data,
        collectionId: collection.id
      })
    },
    onSuccess: () => {
      router.refresh()
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

  const handleGenerate = (data: ImageGenerationConfig) => {
    generateMutation.mutate(data)
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
                    {images.length} Bilder • {collection.type} • {collection.status}
                </p>
            </div>
            
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

        {/* Configuration Panel */}
        <div>
            <ConfigurationPanel 
                onGenerate={handleGenerate}
                isPending={generateMutation.isPending}
                hasGeneratedImages={true}
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
            <ImageGallery images={images} />
        </div>

      </div>
  )
}
