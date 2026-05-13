import { useState, useCallback, useEffect } from 'react'
import { useCreateArticle } from './useArticleMutations'

async function importFiles(files: File[], createArticle: (data: { title: string; content: string }) => Promise<unknown>) {
  const mdFiles = files.filter((f) => f.name.endsWith('.md') || f.name.endsWith('.txt'))
  for (const file of mdFiles) {
    const content = await file.text()
    const title = file.name.replace(/\.(md|txt)$/, '')
    await createArticle({ title, content })
  }
  return mdFiles.length
}

export function useDragDrop() {
  const [isDragging, setIsDragging] = useState(false)
  const [dropMessage, setDropMessage] = useState<string | null>(null)
  const { mutateAsync: createArticle } = useCreateArticle()

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? [])
      if (files.length === 0) return
      const count = await importFiles(files, createArticle)
      if (count > 0) {
        e.preventDefault()
        setDropMessage(`${count}件追加しました`)
        setTimeout(() => setDropMessage(null), 3000)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [createArticle])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const count = await importFiles(Array.from(e.dataTransfer.files), createArticle)
      if (count > 0) {
        setDropMessage(`${count}件追加しました`)
        setTimeout(() => setDropMessage(null), 3000)
      }
    },
    [createArticle]
  )

  return { isDragging, dropMessage, handleDragEnter, handleDragOver, handleDragLeave, handleDrop }
}
