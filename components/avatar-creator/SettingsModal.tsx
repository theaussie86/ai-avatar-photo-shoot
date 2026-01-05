"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Lock, LogOut, Loader2, CheckCircle2, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { updateGeminiApiKey, deleteGeminiApiKey } from "@/app/actions/profile-actions"
import { ApiKeySchema } from "@/lib/schemas"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

interface SettingsModalProps {
  children?: React.ReactNode;
}

export function SettingsModal({ children }: SettingsModalProps) {
  const [apiKey, setApiKey] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "success" | "error">("idle")
  const [userEmail, setUserEmail] = React.useState<string | null>(null)
  const [hasStoredKey, setHasStoredKey] = React.useState(false)

  const queryClient = useQueryClient()
  const supabase = createClient()

  // 1. Query for User Profile
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: profile } = await supabase
        .from("profiles")
        .select("gemini_api_key")
        .eq("id", user.id)
        .single()
      
      return {
        email: user.email,
        hasKey: !!profile?.gemini_api_key
      }
    }
  })

  // 2. Mutation for Updating Key
  const mutation = useMutation({
    mutationFn: updateGeminiApiKey,
    onSuccess: (result) => {
       if (result.success) {
         setSaveStatus("success")
         queryClient.invalidateQueries({ queryKey: ['profile'] })
         setApiKey("••••••••••••••••")
         setTimeout(() => setSaveStatus("idle"), 3000)
       } else {
         setSaveStatus("error")
       }
    },
    onError: (error) => {
       console.error("Save error:", error)
       setSaveStatus("error")
    }
  })

  // 3. Mutation for Deleting Key
  const deleteMutation = useMutation({
    mutationFn: deleteGeminiApiKey,
    onSuccess: (result) => {
      if (result.success) {
        setApiKey("")
        setHasStoredKey(false)
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      }
    },
    onError: (error) => {
      console.error("Delete error:", error)
    }
  })

  // Sync state with query data
  React.useEffect(() => {
    if (profileData?.hasKey) {
       setHasStoredKey(true)
       // Set initial placeholder if key exists
       if (!apiKey) setApiKey("••••••••••••••••")
    } else {
       setHasStoredKey(false)
    }
    if (profileData?.email) {
       setUserEmail(profileData.email)
    }
  }, [profileData]) // Effect only runs when data changes


  const handleSave = async () => {
    if (!apiKey || apiKey === "••••••••••••••••") return

    setSaveStatus("idle")
    
    // Validate first
    const validation = ApiKeySchema.safeParse({ apiKey })
    if (!validation.success) {
        setSaveStatus("error")
        return
    }

    mutation.mutate({ apiKey })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1a1b26] border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Einstellungen</DialogTitle>
          <p className="text-zinc-400 text-sm">
            Konfiguriere deinen API Key und andere Einstellungen
          </p>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="apiKey" className="text-base font-semibold">Google Gemini API Key</Label>
              {hasStoredKey && (
                <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20">
                  Gespeichert
                </span>
              )}
            </div>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    if (saveStatus !== "idle") setSaveStatus("idle")
                  }}
                  onFocus={() => {
                    if (apiKey === "••••••••••••••••") {
                      setApiKey("")
                    }
                  }}
                  placeholder={hasStoredKey ? "••••••••••••••••" : "Gib deinen API Key ein..."}
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500 pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Lock className="h-4 w-4" />
                </div>
              </div>
              
              {hasStoredKey && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="shrink-0 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              Dein API Key wird verschlüsselt in der Datenbank gespeichert.
            </p>
            
            <Button 
              onClick={handleSave} 
              disabled={mutation.isPending || !apiKey || apiKey === "••••••••••••••••"}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-[0.98]"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : saveStatus === "success" ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Gespeichert!
                </>
              ) : (
                "Key speichern"
              )}
            </Button>
            {saveStatus === "error" && (
              <p className="text-xs text-red-400 text-center mt-2">
                Fehler beim Speichern. Bitte versuche es erneut.
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-800 space-y-4">
            <div className="space-y-1">
               <h4 className="text-sm font-semibold text-white">Account</h4>
               <p className="text-sm text-zinc-400">Angemeldet als: {userEmail ?? "Lädt..."}</p>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full justify-center gap-2 border-zinc-700 hover:bg-zinc-800 hover:text-white bg-transparent text-zinc-300"
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                window.location.href = "/login"
              }}
            >
              <LogOut className="h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
