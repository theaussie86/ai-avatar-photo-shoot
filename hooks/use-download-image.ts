
import { useMutation } from "@tanstack/react-query"

interface DownloadImageParams {
  url: string
  fileName: string
}

export function useDownloadImage() {
  return useMutation({
    mutationFn: async ({ url, fileName }: DownloadImageParams) => {
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
        return true
      } catch (error) {
        console.error('Download failed:', error)
        // Fallback
        window.open(url, '_blank')
        throw error
      }
    }
  })
}
