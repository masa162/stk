import { useMutation, useQueryClient } from '@tanstack/react-query'

async function updateTag(id: number, name: string): Promise<void> {
  const response = await fetch(`/api/tags/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update tag: ${response.statusText}`)
  }
}

async function deleteTag(id: number): Promise<void> {
  const response = await fetch(`/api/tags/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete tag: ${response.statusText}`)
  }
}

async function bulkDeleteTags(tagIds: number[]): Promise<void> {
  const response = await fetch('/api/tags/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tagIds }),
  })

  if (!response.ok) {
    throw new Error(`Failed to bulk delete tags: ${response.statusText}`)
  }
}

/**
 * Custom hook for tag update mutation
 */
export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateTag(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

/**
 * Custom hook for tag deletion mutation
 */
export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

/**
 * Custom hook for bulk tag deletion mutation
 */
export function useBulkDeleteTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bulkDeleteTags,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}
