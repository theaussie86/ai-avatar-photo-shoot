"use client"

import * as React from "react"
import { CreatorLayout } from "@/components/avatar-creator/CreatorLayout";
import { ConfigurationPanel } from "@/components/avatar-creator/ConfigurationPanel";
import { ImageGallery } from "@/components/avatar-creator/ImageGallery";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";
import { generateImagesAction } from "@/app/actions/image-actions";


import { ImageGenerationConfig } from "@/lib/schemas";

export default function Home() {
  const [generatedImages, setGeneratedImages] = React.useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  const mutation = useMutation({
    mutationFn: generateImagesAction,
    onSuccess: (newImages: string[]) => {
      setGeneratedImages((prev) => [...prev, ...newImages])
    },
    onError: (error: Error) => {
      console.error("Generation failed:", error)
      alert("Fehler bei der Generierung: " + error.message)
    }
  })

  React.useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
      }
    }
    checkUser()
  }, [router, supabase])


  const handleGenerate = (data: ImageGenerationConfig) => {
    mutation.mutate(data)
  }

  const handleReset = () => {
    setGeneratedImages([])
  }

  return (
    <CreatorLayout>
      <div className="space-y-6">
        <ConfigurationPanel 
          hasGeneratedImages={generatedImages.length > 0}
          onGenerate={handleGenerate}
          onReset={handleReset}
          isPending={mutation.isPending}
        />
      </div>
      <div className="space-y-6">
         <ImageGallery images={generatedImages} />
      </div>
    </CreatorLayout>
  );
}
