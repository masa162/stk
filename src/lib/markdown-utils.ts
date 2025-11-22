/**
 * Extract the first image URL from markdown content
 * Matches patterns like ![alt text](https://example.com/image.jpg)
 */
export function extractFirstImageUrl(markdown: string): string | null {
  if (!markdown) return null

  // Match ![...](URL) pattern
  const imageRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/
  const match = markdown.match(imageRegex)

  return match ? match[1] : null
}
