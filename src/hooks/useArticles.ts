import { useState, useEffect } from 'react'
import type { ArticleMetadata } from '../lib/db/types'

interface UseArticlesResult {
  articles: ArticleMetadata[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Custom hook for fetching articles
 * Provides loading state, error handling, and refetch functionality
 */
export function useArticles(): UseArticlesResult {
  const [articles, setArticles] = useState<ArticleMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchArticles = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/articles')

      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.statusText}`)
      }

      const data = await response.json()
      setArticles(data.articles || [])
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      setError(error)
      console.error('Failed to fetch articles:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [])

  return {
    articles,
    loading,
    error,
    refetch: fetchArticles
  }
}
