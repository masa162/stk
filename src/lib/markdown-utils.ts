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

/**
 * Extract text excerpt from markdown content
 * Removes markdown syntax, images, and extra whitespace
 */
export function extractExcerpt(markdown: string, maxLength: number = 100): string | null {
  if (!markdown) return null

  let text = markdown

  // Remove images ![alt](url)
  text = text.replace(/!\[.*?\]\(.*?\)/g, '')

  // Remove links but keep link text [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Remove headings (#, ##, etc.)
  text = text.replace(/^#{1,6}\s+/gm, '')

  // Remove bold/italic **, *, __, _
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2')
  text = text.replace(/(\*|_)(.*?)\1/g, '$2')

  // Remove inline code `code`
  text = text.replace(/`([^`]+)`/g, '$1')

  // Remove code blocks ```code```
  text = text.replace(/```[\s\S]*?```/g, '')

  // Remove blockquotes >
  text = text.replace(/^>\s+/gm, '')

  // Remove horizontal rules ---, ***, ___
  text = text.replace(/^[\-*_]{3,}$/gm, '')

  // Normalize whitespace and newlines
  text = text.replace(/\s+/g, ' ').trim()

  // Truncate to maxLength
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...'
  }

  return text || null
}

/**
 * Extract YouTube video ID from text
 * Supports various YouTube URL formats:
 * - https://www.youtube.com/watch?v={VIDEO_ID}
 * - https://youtu.be/{VIDEO_ID}
 * - https://m.youtube.com/watch?v={VIDEO_ID}
 */
export function extractYouTubeVideoId(text: string): string | null {
  if (!text) return null

  // Match YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

/**
 * Generate YouTube thumbnail URL from video ID
 * Uses maxresdefault.jpg for best quality
 */
export function getYouTubeThumbnailUrl(videoId: string): string {
  // Use maxresdefault for best quality (1280x720)
  // Falls back to hqdefault (480x360) if maxresdefault doesn't exist
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}
