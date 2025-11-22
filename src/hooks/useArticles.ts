import { useQuery } from '@tanstack/react-query'
import type { ArticleMetadata } from '../lib/db/types'

async function fetchArticles(): Promise<ArticleMetadata[]> {
  const response = await fetch('/api/articles')

  if (!response.ok) {
    throw new Error(`Failed to fetch articles: ${response.statusText}`)
  }

  const data = await response.json()
  return data.articles || []
}

/**
 * Custom hook for fetching articles using TanStack Query
 * Provides automatic caching, loading state, error handling, and refetch functionality
 */
export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: fetchArticles,
  })
}
