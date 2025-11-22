import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Category } from '../lib/db/types'

interface CreateCategoryData {
  name: string
  color?: string
  parent_id?: number | null
}

interface UpdateCategoryData {
  id: number
  name: string
  color: string
}

async function createCategory(data: CreateCategoryData): Promise<{ id: number }> {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Failed to create category: ${response.statusText}`)
  }

  return response.json()
}

async function updateCategory(data: UpdateCategoryData): Promise<void> {
  const response = await fetch(`/api/categories/${data.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: data.name, color: data.color }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update category: ${response.statusText}`)
  }
}

async function deleteCategory(id: number): Promise<void> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete category: ${response.statusText}`)
  }
}

/**
 * Custom hook for category creation mutation
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

/**
 * Custom hook for category update mutation
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

/**
 * Custom hook for category deletion mutation
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}
