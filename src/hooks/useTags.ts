import { useState, useEffect } from 'react'
import type { Tag } from '../lib/db/types'

interface UseTagsResult {
  tags: Tag[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Custom hook for fetching tags
 * Provides loading state, error handling, and refetch functionality
 */
export function useTags(): UseTagsResult {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTags = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/tags')

      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.statusText}`)
      }

      const data = await response.json()
      setTags(data.tags || [])
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      setError(error)
      console.error('Failed to fetch tags:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTags()
  }, [])

  return {
    tags,
    loading,
    error,
    refetch: fetchTags
  }
}
