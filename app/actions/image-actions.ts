"use server"

export async function generateImagesAction() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Return mock image URLs
  return [
    "/placeholder-image.jpg",
    "/placeholder-image.jpg",
    "/placeholder-image.jpg",
  ]
}
