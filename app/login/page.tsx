import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/components/login-form"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/")
  }

  return (
    <div className="dark bg-background text-foreground flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-3 self-center font-medium">
          <div className="flex items-center justify-center rounded-md">
            <img src="/logo.png" alt="KI Foto Shooting Logo" className="size-10 rounded-md object-cover" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-600 bg-clip-text text-transparent">
            KI Foto Shooting
          </span>
        </a>
        <LoginForm />
      </div>
    </div>
  )
}
