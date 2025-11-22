import { useQuery } from '@tanstack/react-query'
import type { Article } from '../lib/db/types'

async function fetchArticle(articleId: number): Promise<Article> {
  const response = await fetch(`/api/articles/${articleId}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch article: ${response.statusText}`)
  }

  const data = await response.json()
  return data.article
}

/**
 * Custom hook for fetching a single article by ID using TanStack Query
 * Provides automatic caching, loading state, error handling, and refetch functionality
 */
export function useArticle(articleId: number | null) {
  return useQuery({
    queryKey: ['articles', articleId],
    queryFn: () => fetchArticle(articleId!),
    enabled: articleId !== null,
  })
}
