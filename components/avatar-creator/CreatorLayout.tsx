"use client"

import { ReactNode } from "react"
import { AvatarCreatorHeader } from "./Header"
import { SettingsModal } from "./SettingsModal"

interface CreatorLayoutProps {
  children: ReactNode
}

export function CreatorLayout({ children }: CreatorLayoutProps) {
  return (
    <div className="min-h-screen bg-[#09090b] text-foreground p-4 sm:p-8 relative overflow-x-hidden font-sans selection:bg-purple-500/30">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="absolute top-0 right-0 z-50">
           <SettingsModal />
        </div>
        
        <AvatarCreatorHeader />
        
        <main className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {children}
        </main>
      </div>
    </div>
  )
}
