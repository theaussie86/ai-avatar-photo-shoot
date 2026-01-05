"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, RefreshCw, Trash2 } from "lucide-react"
import Link from "next/link"
import { ConfigurationPanel } from "@/components/avatar-creator/ConfigurationPanel"
import { generateImagesAction, deleteCollectionAction } from "@/app/actions/image-actions"
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
  const [isGenerating, setIsGenerating] = React.useState(false)

  const handleGenerate = async (data: ImageGenerationConfig) => {
    try {
      setIsGenerating(true)
      // Pass collectionId to add to this collection
      await generateImagesAction({
        ...data,
        collectionId: collection.id
      })
      router.refresh()
    } catch (error) {
      console.error("Failed to generate:", error)
      alert("Fehler bei der Generierung")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = async () => {
    try {
        await deleteCollectionAction(collection.id);
        router.push("/collections");
    } catch (error) {
        console.error("Delete failed:", error);
        alert("Fehler beim Löschen");
    }
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
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-none">
                    Löschen bestätigen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>

        {/* Configuration Panel */}
        <div>
            <ConfigurationPanel 
                onGenerate={handleGenerate}
                isPending={isGenerating}
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img) => (
                    <div key={img.id} className="relative aspect-square group rounded-lg overflow-hidden border border-white/10 bg-gray-900">
                        <img 
                            src={img.url} 
                            alt="Generated" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" asChild>
                                <a href={img.url} download target="_blank" rel="noopener noreferrer">
                                    <Download className="w-4 h-4" />
                                </a>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
  )
}
