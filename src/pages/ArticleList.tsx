import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ArticleMetadata, Tag } from '../lib/db/types'
import Sidebar from '../components/Sidebar'
import ScrollTop from '../components/ScrollTop'

export default function ArticleList() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<ArticleMetadata[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sortColumn, setSortColumn] = useState<'title' | 'created_at' | 'updated_at'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    fetchArticles()
    fetchTags()
  }, [])

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles', {
        headers: {
          Authorization: 'Basic ' + btoa('mn:39'),
        },
      })
      const data = await response.json()
      setArticles(data.articles || [])
    } catch (error) {
      console.error('Failed to fetch articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags', {
        headers: {
          Authorization: 'Basic ' + btoa('mn:39'),
        },
      })
      const data = await response.json()
      setAllTags(data.tags || [])
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  // Filtering
  const filteredArticles = articles.filter((article) => {
    if (selectedCategoryId !== null && article.category_id !== selectedCategoryId) {
      return false
    }
    if (selectedTagId !== null) {
      const hasTag = article.tags?.some((tag) => tag.id === selectedTagId)
      if (!hasTag) return false
    }
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase()
      const matchTitle = article.title.toLowerCase().includes(keyword)
      const matchMemo = article.memo?.toLowerCase().includes(keyword)
      if (!matchTitle && !matchMemo) return false
    }
    return true
  })

  // Sorting
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    const aValue = a[sortColumn] || ''
    const bValue = b[sortColumn] || ''
    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Pagination
  const totalPages = Math.ceil(sortedArticles.length / ITEMS_PER_PAGE)
  const paginatedArticles = sortedArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSort = (column: 'title' | 'created_at' | 'updated_at') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
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
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          selectedCategoryId={selectedCategoryId}
          selectedTagId={selectedTagId}
          onCategorySelect={setSelectedCategoryId}
          onTagSelect={setSelectedTagId}
          tags={allTags}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-white overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-20 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="text-2xl"
              aria-label="Open menu"
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold">記事一覧</h1>
            <div className="w-8" />
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block p-8 border-b">
          <h1 className="text-3xl font-bold mb-4">記事一覧</h1>

          {/* Search Field */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="タイトルやメモから検索..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  クリア
                </button>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {filteredArticles.length}件の記事
            {searchKeyword && ` (「${searchKeyword}」で検索中)`}
          </div>
        </div>

        {/* Article Table */}
        <div className="p-4 md:p-8">
          {paginatedArticles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              記事がありません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <colgroup>
                  <col style={{ width: '42%' }} />
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '15%' }} />
                </colgroup>
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th
                      onClick={() => handleSort('title')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      タイトル {sortColumn === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      メモ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      カテゴリ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      タグ
                    </th>
                    <th
                      onClick={() => handleSort('created_at')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      作成日 {sortColumn === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('updated_at')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      更新日 {sortColumn === 'updated_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedArticles.map((article) => (
                    <tr
                      key={article.id}
                      onClick={() => navigate(`/articles/${article.id}`)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          {article.title}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 truncate max-w-xs">
                          {article.memo}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {article.category_id && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-800">
                            Category {article.category_id}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {article.tags?.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(article.created_at).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(article.updated_at).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                前へ
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first, last, current, and adjacent pages
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 border rounded ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  } else if (page === currentPage - 3 || page === currentPage + 3) {
                    return <span key={page} className="px-2">...</span>
                  }
                  return null
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-30">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80%]">
            <Sidebar
              selectedCategoryId={selectedCategoryId}
              selectedTagId={selectedTagId}
              onCategorySelect={(id) => {
                setSelectedCategoryId(id)
                setMobileSidebarOpen(false)
              }}
              onTagSelect={(id) => {
                setSelectedTagId(id)
                setMobileSidebarOpen(false)
              }}
              tags={allTags}
            />
          </div>
        </div>
      )}

      <ScrollTop />
    </div>
  )
}
