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
