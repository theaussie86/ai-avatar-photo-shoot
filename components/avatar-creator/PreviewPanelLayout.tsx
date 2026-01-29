"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

interface PreviewPanelLayoutProps {
  children: React.ReactNode
  panelContent?: React.ReactNode
  isPanelOpen: boolean
  onPanelOpenChange: (open: boolean) => void
}

/**
 * Hook to detect desktop viewport (>=1024px)
 * Returns null during SSR to prevent hydration mismatch
 */
function useMediaQuery(query: string): boolean | null {
  const [matches, setMatches] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const media = window.matchMedia(query)

    // Set initial value
    setMatches(media.matches)

    // Create listener
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)

    // Use addEventListener for modern browsers
    media.addEventListener('change', listener)

    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

export function PreviewPanelLayout({
  children,
  panelContent,
  isPanelOpen,
  onPanelOpenChange,
}: PreviewPanelLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // During SSR or initial render, render with basic layout to prevent hydration issues
  if (isDesktop === null) {
    return <div className="flex-1 flex w-full h-full min-h-0">{children}</div>
  }

  // Desktop layout with inline side panel
  if (isDesktop) {
    return (
      <div className="flex-1 flex w-full h-full min-h-0">
        {/* Preview area - shrinks when panel is open */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
            isPanelOpen ? "min-w-[50%]" : "w-full"
          )}
        >
          {children}
        </div>

        {/* Inline panel for desktop */}
        <div
          className={cn(
            "h-full bg-zinc-900/95 border-l border-white/10 transition-all duration-300 ease-in-out overflow-hidden",
            isPanelOpen ? "w-[400px]" : "w-0"
          )}
        >
          {isPanelOpen && (
            <div className="w-[400px] h-full flex flex-col">
              {/* Panel header with close button */}
              <div className="flex items-center justify-end p-2 border-b border-white/10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                  onClick={() => onPanelOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {/* Panel content */}
              <div className="flex-1 overflow-y-auto">
                {panelContent}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Mobile layout with bottom drawer
  return (
    <div className="flex-1 flex flex-col w-full h-full min-h-0">
      {/* Preview takes full area */}
      {children}

      {/* Drawer for mobile */}
      <Drawer open={isPanelOpen} onOpenChange={onPanelOpenChange}>
        <DrawerContent showCloseButton={true}>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {panelContent}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

// Helper for className merging
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
