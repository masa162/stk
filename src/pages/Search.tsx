import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ArticleMetadata, Tag } from '../lib/db/types'
import Sidebar from '../components/layout/Sidebar'
import ScrollTop from '../components/common/ScrollTop'

export default function Search() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ArticleMetadata[]>([])
  const [searching, setSearching] = useState(false)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      const data = await response.json()
      setAllTags(data.tags || [])
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setResults(data.articles || [])
    } catch (error) {
      console.error('Failed to search:', error)
    } finally {
      setSearching(false)
    }
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

      <main className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="md:hidden sticky top-0 z-20 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="text-2xl">☰</button>
            <h1 className="text-lg font-semibold">検索</h1>
            <div className="w-8" />
          </div>
        </div>

        <div className="p-4 md:p-8">
          <h1 className="hidden md:block text-3xl font-bold mb-6">記事を検索</h1>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="タイトルや本文から検索..."
                className="flex-1 px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={searching}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {searching ? '検索中...' : '検索'}
              </button>
            </div>
          </form>

          {query && (
            <div className="mb-4 text-sm text-gray-600">
              「{query}」の検索結果: {results.length}件
            </div>
          )}

          {results.length === 0 && query ? (
            <div className="text-center py-12 text-gray-500">
              検索結果が見つかりませんでした
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((article) => (
                <div
                  key={article.id}
                  onClick={() => navigate(`/articles/${article.id}`)}
                  className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h2 className="text-xl font-semibold mb-2 text-blue-600 hover:text-blue-800">
                    {article.title}
                  </h2>
                  {article.memo && (
                    <p className="text-gray-600 mb-3">{article.memo}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>作成: {new Date(article.created_at).toLocaleDateString('ja-JP')}</span>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex gap-1">
                        {article.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
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
