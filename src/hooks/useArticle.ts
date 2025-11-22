import { useState, useEffect } from 'react'
import type { Article } from '../lib/db/types'

interface UseArticleResult {
  article: Article | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Custom hook for fetching a single article by ID
 * Provides loading state, error handling, and refetch functionality
 */
export function useArticle(articleId: number | null): UseArticleResult {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchArticle = async () => {
    if (!articleId) {
      setArticle(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/articles/${articleId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.statusText}`)
      }

      const data = await response.json()
      setArticle(data.article)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      setError(error)
      console.error('Failed to fetch article:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticle()
  }, [articleId])

  return {
    article,
    loading,
    error,
    refetch: fetchArticle
  }
}
