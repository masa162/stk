import { useQuery } from '@tanstack/react-query'
import type { Category } from '../lib/db/types'

async function fetchCategories(): Promise<Category[]> {
  const response = await fetch('/api/categories')

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`)
  }

  const data = await response.json()
  return data.categories || []
}

/**
 * Custom hook for fetching categories using TanStack Query
 * Provides automatic caching, loading state, error handling, and refetch functionality
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })
}
