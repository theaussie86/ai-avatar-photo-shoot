"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Crown } from "lucide-react"

export function AvatarCreatorHeader() {
  return (
    <div className="flex flex-col gap-2 mb-8 text-center sm:text-left">
      <div className="flex items-center justify-center sm:justify-start gap-3">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-purple-400 to-indigo-600 bg-clip-text text-transparent">
          KI Foto Shooting
        </h1>
        <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border-0">v1.0</Badge>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-muted-foreground text-lg">
          Generiere vielfältige Character-Posen mit KI
        </p>
        
        {/* <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" className="hidden sm:flex text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20">
             <Sparkles className="mr-2 h-4 w-4" />
             Premium Features Active
           </Button>
        </div> */}
      </div>
    </div>
  )
}
