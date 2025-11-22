import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ArticleMetadata, Tag } from '../lib/db/types'
import Sidebar from '../components/Sidebar'
import ScrollTop from '../components/ScrollTop'

export default function Trash() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<ArticleMetadata[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    fetchTrashedArticles()
    fetchTags()
  }, [])

  const fetchTrashedArticles = async () => {
    try {
      const response = await fetch('/api/trash')
      const data = await response.json()
      setArticles(data.articles || [])
    } catch (error) {
      console.error('Failed to fetch trashed articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      const data = await response.json()
      setAllTags(data.tags || [])
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const handleRestore = async (id: number) => {
    if (!confirm('この記事を復元しますか？')) return

    try {
      const response = await fetch(`/api/trash/${id}`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('記事を復元しました')
        fetchTrashedArticles()
      } else {
        alert('復元に失敗しました')
      }
    } catch (error) {
      console.error('Failed to restore article:', error)
      alert('復元に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <div className="hidden md:block">
        <Sidebar
          selectedCategoryId={null}
          selectedTagId={null}
          onCategorySelect={() => {}}
          onTagSelect={() => {}}
          tags={allTags}
        />
      </div>

      <main className="flex-1 bg-white overflow-y-auto">
        <div className="md:hidden sticky top-0 z-20 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="text-2xl">☰</button>
            <h1 className="text-lg font-semibold">ゴミ箱</h1>
            <div className="w-8" />
          </div>
        </div>

        <div className="p-4 md:p-8">
          <h1 className="hidden md:block text-3xl font-bold mb-6">ゴミ箱</h1>
          <div className="text-sm text-gray-500 mb-4">{articles.length}件の削除済み記事</div>

          {articles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">ゴミ箱は空です</div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg mb-2">{article.title}</h3>
                      <div className="text-sm text-gray-500">
                        削除日: {new Date(article.deleted_at!).toLocaleString('ja-JP')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestore(article.id)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      復元
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80%]">
            <Sidebar selectedCategoryId={null} selectedTagId={null} onCategorySelect={() => {}} onTagSelect={() => {}} tags={allTags} />
          </div>
        </div>
      )}

      <ScrollTop />
    </div>
  )
}
