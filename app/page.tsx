
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ConfigurationPanel } from "@/components/avatar-creator/ConfigurationPanel";
import { generateImagesAction } from "@/app/actions/image-actions";
import { Header } from "@/components/layout/Header";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Get user profile including full_name
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
        
       <Header user={user} profile={profile} />

      <main className="container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-4xl mx-auto space-y-12">
             
             {/* Hero Section */}
             <div className="text-center space-y-6">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                   <span className="block text-white mb-2">Erstelle professionelle</span>
                   <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                      AI Avatare & Fotos
                   </span>
                </h1>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                   Lade deine Referenzbilder hoch und lass unsere KI fotorealistische Aufnahmen in jedem gewünschten Stil generieren.
                </p>
             </div>

             {/* Main Configuration Panel */}
             <ConfigurationPanel onGenerate={generateImagesAction} />

          </div>
      </main>
    </div>
  );
}
