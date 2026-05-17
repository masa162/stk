import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useCreateArticle } from '../hooks/useArticleMutations'

function getTimestampTitle() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
}

export default function Quick() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const { mutateAsync: createArticle, isPending } = useCreateArticle()

  const canSave = title.trim() || content.trim()

  const handleSave = useCallback(async () => {
    if (!canSave) return
    await createArticle({
      title: title.trim() || getTimestampTitle(),
      content: content || '',
    })
    setSaved(true)
    setTitle('')
    setContent('')
    contentRef.current?.focus()
    setTimeout(() => setSaved(false), 2000)
  }, [title, content, canSave, createArticle])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  useEffect(() => {
    contentRef.current?.focus()
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col pb-16">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <Link to="/" className="text-gray-500 hover:text-white text-sm transition-colors">
          ← STK
        </Link>
        <span className="text-gray-700 text-xs hidden md:block">⌘ Enter to save</span>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title  (optional)"
          className="w-full bg-transparent border-none outline-none text-2xl text-white placeholder-gray-700 font-medium"
        />
        <div className="h-px bg-gray-800" />
        <textarea
          ref={contentRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="..."
          className="flex-1 w-full bg-transparent border-none outline-none text-gray-300 placeholder-gray-800 resize-none text-base leading-relaxed"
          style={{ minHeight: '40vh' }}
        />
      </div>

      <footer className="fixed bottom-0 left-0 right-0 px-6 py-3 border-t border-gray-800 bg-gray-950 flex items-center justify-end gap-4">
        {saved && <span className="text-green-400 text-sm animate-pulse">Saved ✓</span>}
        <button
          onClick={handleSave}
          disabled={isPending || !canSave}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-20 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
      </footer>
    </div>
  )
}
