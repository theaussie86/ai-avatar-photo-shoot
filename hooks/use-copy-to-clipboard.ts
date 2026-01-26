import { useState, useCallback } from "react"

interface UseCopyToClipboardOptions {
  resetDelay?: number
}

interface UseCopyToClipboardReturn {
  isCopied: boolean
  isError: boolean
  copy: (text: string) => Promise<boolean>
}

export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardReturn {
  const { resetDelay = 2000 } = options
  const [isCopied, setIsCopied] = useState(false)
  const [isError, setIsError] = useState(false)

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        // Reset states
        setIsError(false)
        setIsCopied(false)

        // Try modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text)
          setIsCopied(true)

          // Haptic feedback for mobile devices
          if (navigator.vibrate) {
            navigator.vibrate(50)
          }

          // Reset state after delay
          setTimeout(() => {
            setIsCopied(false)
          }, resetDelay)

          return true
        } else {
          // Fallback for older browsers
          return await fallbackCopy(text)
        }
      } catch (error) {
        console.error("Copy failed:", error)
        setIsError(true)

        // Try fallback if Clipboard API fails
        const fallbackSuccess = await fallbackCopy(text)

        // Reset error state after delay
        setTimeout(() => {
          setIsError(false)
        }, resetDelay)

        return fallbackSuccess
      }
    },
    [resetDelay]
  )

  // Fallback copy using execCommand
  const fallbackCopy = async (text: string): Promise<boolean> => {
    try {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      textarea.style.pointerEvents = "none"
      document.body.appendChild(textarea)
      textarea.select()

      const success = document.execCommand("copy")
      document.body.removeChild(textarea)

      if (success) {
        setIsCopied(true)

        // Haptic feedback for mobile devices
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }

        // Reset state after delay
        setTimeout(() => {
          setIsCopied(false)
        }, resetDelay)
      } else {
        setIsError(true)
        setTimeout(() => {
          setIsError(false)
        }, resetDelay)
      }

      return success
    } catch (error) {
      console.error("Fallback copy failed:", error)
      setIsError(true)
      setTimeout(() => {
        setIsError(false)
      }, resetDelay)
      return false
    }
  }

  return { isCopied, isError, copy }
}
