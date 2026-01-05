
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { CollectionDetailClient } from "@/components/collections/CollectionDetailClient"

import { Header } from "@/components/layout/Header"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function CollectionDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    // Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Fetch Collection
    const { data: collection, error } = await supabase
        .from("collections")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

    if (error || !collection) {
        notFound()
    }

    // Fetch Images
    const { data: images } = await supabase
        .from("images")
        .select("*")
        .eq("collection_id", id)
        .order("created_at", { ascending: false })

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <Header user={user} profile={profile} />
            <div className="container mx-auto px-6 pt-32 pb-20">
                <CollectionDetailClient collection={collection} images={images || []} />
            </div>
        </div>
    )
}
