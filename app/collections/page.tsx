
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import { Header } from "@/components/layout/Header"
import { Camera, Layers, Clock } from "lucide-react"

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile for header
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: collections } = await supabase
    .from("collections")
    .select(`
      *,
      images (*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
      <Header user={user} profile={profile} />
      
      <div className="container mx-auto px-6 pt-32 pb-20">
        <div className="flex items-center justify-between mb-8">
            <div>
                 <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                     Meine Shootings
                </h1>
                <p className="text-gray-400 mt-2">
                    Verwalte deine generierten Shooting-Sessions
                </p>
            </div>
            <Link 
                href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
                <Camera className="w-4 h-4" />
                Neues Shooting
            </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections?.map((collection) => {
                const previewImage = collection.images?.[0]?.url
                const imageCount = collection.images?.length || 0
                
                return (
                    <Link 
                        key={collection.id} 
                        href={`/collections/${collection.id}`}
                        className="group relative block overflow-hidden rounded-xl bg-gray-900 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20"
                    >
                        {/* Preview Image Area */}
                        <div className="aspect-[16/9] w-full bg-gray-800 relative overflow-hidden">
                            {previewImage ? (
                                <img 
                                    src={previewImage} 
                                    alt={collection.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800/50">
                                    <Layers className="w-12 h-12 text-gray-700" />
                                </div>
                            )}
                            
                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                                <span className={`
                                    px-2 py-1 rounded-md text-xs font-medium backdrop-blur-md
                                    ${collection.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : ''}
                                    ${collection.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : ''}
                                    ${collection.status === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : ''}
                                `}>
                                    {collection.status === 'completed' && 'Fertig'}
                                    {collection.status === 'processing' && 'In Arbeit'}
                                    {collection.status === 'failed' && 'Fehler'}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-3">
                            <h3 className="font-semibold text-lg text-white group-hover:text-purple-400 transition-colors">
                                {collection.name}
                            </h3>
                            
                            <div className="flex items-center justify-between text-sm text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <Layers className="w-4 h-4" />
                                    <span>{imageCount} Bilder</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        {collection.created_at && formatDistanceToNow(new Date(collection.created_at), { addSuffix: true, locale: de })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                )
            })}

            {(!collections || collections.length === 0) && (
                <div className="col-span-full py-20 text-center space-y-4 rounded-2xl border border-dashed border-gray-800 bg-gray-900/50">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                        <Camera className="w-8 h-8 text-gray-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-medium text-white">Noch keine Shootings</h3>
                        <p className="text-gray-400 mt-1">Erstelle dein erstes AI-Shooting um loszulegen.</p>
                    </div>
                    <Link 
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
                    >
                        Jetzt starten
                    </Link>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
