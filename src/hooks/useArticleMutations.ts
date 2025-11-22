import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Article } from '../lib/db/types'

interface CreateArticleData {
  title: string
  content: string
  memo?: string
  category_id?: number
  tags?: string[]
}

interface UpdateArticleData extends CreateArticleData {
  id: number
}

async function createArticle(data: CreateArticleData): Promise<Article> {
  const response = await fetch('/api/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Failed to create article: ${response.statusText}`)
  }

  const result = await response.json()
  return result.article
}

async function updateArticle(data: UpdateArticleData): Promise<Article> {
  const response = await fetch(`/api/articles/${data.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Failed to update article: ${response.statusText}`)
  }

  const result = await response.json()
  return result.article
}

async function deleteArticle(id: number): Promise<void> {
  const response = await fetch(`/api/articles/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete article: ${response.statusText}`)
  }
}

/**
 * Custom hook for article creation mutation
 */
export function useCreateArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

/**
 * Custom hook for article update mutation
 */
export function useUpdateArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateArticle,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['articles', data.id] })
    },
  })
}

/**
 * Custom hook for article deletion mutation
 */
export function useDeleteArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}
