"use client"

interface PromptLengthFeedbackProps {
  text: string
}

export function PromptLengthFeedback({ text }: PromptLengthFeedbackProps) {
  // Count words by splitting on whitespace and filtering empty strings
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  // Determine color based on thresholds
  let colorClass = "text-gray-500" // Default for <50 words

  if (wordCount >= 50 && wordCount <= 150) {
    colorClass = "text-green-500" // Optimal
  } else if (wordCount >= 151 && wordCount <= 200) {
    colorClass = "text-yellow-500" // Warning
  } else if (wordCount > 200) {
    colorClass = "text-red-500" // Too long
  }

  return (
    <p className={`text-xs ${colorClass}`}>
      {wordCount} Wörter
    </p>
  )
}
