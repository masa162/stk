import { useQuery } from '@tanstack/react-query'
import type { Tag } from '../lib/db/types'

async function fetchTags(): Promise<Tag[]> {
  const response = await fetch('/api/tags')

  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.statusText}`)
  }

  const data = await response.json()
  return data.tags || []
}

/**
 * Custom hook for fetching tags using TanStack Query
 * Provides automatic caching, loading state, error handling, and refetch functionality
 */
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  })
}
