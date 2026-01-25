"use client"

import * as React from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Drawer, DrawerContent } from "@/components/ui/drawer"

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

  // During SSR or initial render, render without panel to prevent hydration issues
  if (isDesktop === null) {
    return <>{children}</>
  }

  // Desktop layout with side sheet
  if (isDesktop) {
    return (
      <div className="flex w-full h-full">
        {/* Preview area - shrinks when panel is open */}
        <div
          className={cn(
            "flex-1 transition-all duration-200",
            isPanelOpen ? "min-w-[50%]" : "w-full"
          )}
        >
          {children}
        </div>

        {/* Sheet for desktop */}
        <Sheet open={isPanelOpen} onOpenChange={onPanelOpenChange}>
          <SheetContent showCloseButton={true}>
            {panelContent}
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  // Mobile layout with bottom drawer
  return (
    <>
      {/* Preview takes full area */}
      {children}

      {/* Drawer for mobile */}
      <Drawer open={isPanelOpen} onOpenChange={onPanelOpenChange}>
        <DrawerContent showCloseButton={true}>
          {panelContent}
        </DrawerContent>
      </Drawer>
    </>
  )
}

// Helper for className merging
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
