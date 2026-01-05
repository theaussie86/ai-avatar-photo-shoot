"use client"

import * as React from "react"
import { CreatorLayout } from "@/components/avatar-creator/CreatorLayout";
import { ConfigurationPanel } from "@/components/avatar-creator/ConfigurationPanel";
import { ImageGallery } from "@/components/avatar-creator/ImageGallery";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Home() {
  const [generatedImages, setGeneratedImages] = React.useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  React.useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
      }
    }
    checkUser()
  }, [router, supabase])


  const handleGenerate = () => {
    // Mock generation - add 3 placeholder images
    const newImages = Array(3).fill("/placeholder-image.jpg") // You might want to use a real placeholder URL or data URI
    setGeneratedImages([...generatedImages, ...newImages])
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
        />
      </div>
      <div className="space-y-6">
         <ImageGallery images={generatedImages} />
      </div>
    </CreatorLayout>
  );
}
