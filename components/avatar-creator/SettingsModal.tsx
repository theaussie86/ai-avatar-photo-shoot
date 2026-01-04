"use client"

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
import { Settings, Lock, LogOut } from "lucide-react"

export function SettingsModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings className="h-5 w-5" />
        </Button>
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
            <Label htmlFor="apiKey" className="text-base font-semibold">Google Gemini API Key</Label>
            <Input
              id="apiKey"
              placeholder="Gib deinen API Key ein..."
              className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500"
            />
            <p className="text-xs text-zinc-500">
              Dein API Key wird sicher gespeichert und nur lokal verwendet.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Farbschema</Label>
              <Lock className="h-4 w-4 text-zinc-600" />
            </div>
            
            <div className="grid grid-cols-5 gap-2">
               <div className="flex flex-col items-center gap-1">
                 <div className="h-12 w-12 rounded-xl bg-zinc-900 border-2 border-indigo-500 flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600" />
                 </div>
                 <span className="text-[10px] font-medium text-white">Neon</span>
                 <span className="text-[9px] text-zinc-500">Dunkel</span>
               </div>
               
               {/* Themes */}
               {[
                 { name: "Sunset", sub: "Dunkel", color: "from-orange-400 to-red-600" },
                 { name: "Ocean", sub: "Dunkel", color: "from-cyan-400 to-blue-600" },
                 { name: "Frost", sub: "Hell", color: "from-sky-300 to-blue-400" },
                 { name: "Sand", sub: "Hell", color: "from-yellow-200 to-amber-500" }
               ].map((theme) => (
                 <div key={theme.name} className="flex flex-col items-center gap-1 cursor-pointer group">
                    <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative transition-all group-hover:border-zinc-600">
                      <div className={`h-6 w-6 rounded-full bg-gradient-to-br ${theme.color}`} />
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-300">{theme.name}</span>
                    <span className="text-[9px] text-zinc-600">{theme.sub}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 space-y-4">
            <div className="space-y-1">
               <h4 className="text-sm font-semibold text-white">Account</h4>
               <p className="text-sm text-zinc-400">Angemeldet als: christoph@weissteiner-automation.com</p>
               <p className="text-sm text-zinc-400">Plan: Avatar Creator Studio - MVP</p>
            </div>
            
            <Button variant="outline" className="w-full justify-center gap-2 border-zinc-700 hover:bg-zinc-800 hover:text-white bg-transparent">
              <LogOut className="h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
