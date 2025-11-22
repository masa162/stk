import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Article, ArticleMetadata, Tag } from '../lib/db/types'
import Sidebar from '../components/Sidebar'
import TableOfContents from '../components/TableOfContents'
import MarkdownRenderer from '../components/MarkdownRenderer'
import ArticleCardView from '../components/ArticleCardView'
import ScrollTop from '../components/ScrollTop'

type ViewMode = 'gmail' | 'table' | 'card'

export default function ArticleList() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<ArticleMetadata[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('articleViewMode')
    return (saved as ViewMode) || 'gmail'
  })

  // Selected article for preview (Gmail view)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [loadingArticle, setLoadingArticle] = useState(false)

  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sortColumn, setSortColumn] = useState<'title' | 'created_at' | 'updated_at'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  // Save view mode to localStorage when changed
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('articleViewMode', mode)
  }

  useEffect(() => {
    fetchArticles()
    fetchTags()
  }, [])

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles')
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
      const response = await fetch('/api/tags')
      const data = await response.json()
      setAllTags(data.tags || [])
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const fetchArticleDetail = async (articleId: number) => {
    setLoadingArticle(true)
    try {
      const response = await fetch(`/api/articles/${articleId}`)
      const data = await response.json()
      setSelectedArticle(data.article)
    } catch (error) {
      console.error('Failed to fetch article:', error)
    } finally {
      setLoadingArticle(false)
    }
  }

  const handleArticleClick = (article: ArticleMetadata) => {
    // On mobile, navigate to article detail page
    if (window.innerWidth < 768) {
      navigate(`/articles/${article.id}`)
    } else {
      // On desktop, show preview in right pane
      fetchArticleDetail(article.id)
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('コピーしました')
  }

  const handleExportMarkdown = () => {
    if (!selectedArticle) return

    const frontmatter = `---
title: ${selectedArticle.title}
created: ${selectedArticle.created_at}
updated: ${selectedArticle.updated_at}
${selectedArticle.memo ? `memo: ${selectedArticle.memo}` : ''}
tags: ${selectedArticle.tags?.map((t) => t.name).join(', ') || ''}
---

`
    const content = frontmatter + (selectedArticle.content || '')

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedArticle.title}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!selectedArticle) return
    if (!confirm('この記事をゴミ箱に移動しますか?')) return

    try {
      const response = await fetch(`/api/articles/${selectedArticle.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('記事をゴミ箱に移動しました')
        setSelectedArticle(null)
        fetchArticles()
      } else {
        alert('削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete article:', error)
      alert('削除に失敗しました')
    }
  }

  // Render view switcher
  const renderViewSwitcher = () => (
    <div className="flex gap-2">
      <button
        onClick={() => handleViewModeChange('gmail')}
        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
          viewMode === 'gmail'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title="Gmail風ビュー"
      >
        📧 Gmail
      </button>
      <button
        onClick={() => handleViewModeChange('table')}
        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
          viewMode === 'table'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title="テーブルビュー"
      >
        📊 テーブル
      </button>
      <button
        onClick={() => handleViewModeChange('card')}
        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
          viewMode === 'card'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        title="カードビュー"
      >
        🎴 カード
      </button>
    </div>
  )

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

      {/* Gmail View: Two-pane layout */}
      {viewMode === 'gmail' && (
        <>
          {/* Article List Pane */}
          <aside className="w-full md:w-96 lg:w-1/3 bg-white border-r overflow-y-auto">
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

        {/* List Header */}
        <div className="sticky top-0 md:top-0 z-10 bg-white border-b p-4">
          {/* View Switcher - Desktop only */}
          <div className="hidden md:flex mb-3">
            {renderViewSwitcher()}
          </div>

          {/* Search Field */}
          <div className="mb-3">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="タイトルやメモから検索..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-500">
              {filteredArticles.length}件の記事
            </div>
            <div className="flex gap-2">
              <select
                value={sortColumn}
                onChange={(e) => setSortColumn(e.target.value as 'title' | 'created_at' | 'updated_at')}
                className="px-2 py-1 border border-gray-300 rounded text-xs"
              >
                <option value="created_at">作成日</option>
                <option value="updated_at">更新日</option>
                <option value="title">タイトル</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Article List */}
        <div className="divide-y divide-gray-200">
          {paginatedArticles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              記事がありません
            </div>
          ) : (
            paginatedArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedArticle?.id === article.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                  {article.title}
                </h3>
                {article.memo && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                    {article.memo}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {article.category && (
                    <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                      {article.category.name}
                    </span>
                  )}
                  {article.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-0.5 rounded bg-blue-100 text-blue-800"
                    >
                      {tag.name}
                    </span>
                  ))}
                  {article.tags && article.tags.length > 3 && (
                    <span className="text-gray-500">+{article.tags.length - 3}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(article.updated_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="sticky bottom-0 bg-white border-t p-3 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            <span className="text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          </div>
        )}
      </aside>

      {/* Article Preview Pane */}
      <main className="hidden md:flex flex-1 flex-col bg-white overflow-hidden">
        {loadingArticle ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        ) : selectedArticle ? (
          <>
            {/* Article Header */}
            <div className="border-b overflow-y-auto">
              <div className="p-6">
                {/* Title */}
                <h1
                  onClick={() => navigate(`/articles/${selectedArticle.id}`)}
                  className="text-3xl font-bold mb-4 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  {selectedArticle.title}
                </h1>

                {/* ID with copy button */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-500">ID: {selectedArticle.id}</span>
                  <button
                    onClick={() => copyToClipboard(selectedArticle.id.toString())}
                    className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    コピー
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handleExportMarkdown}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                  >
                    MD出力
                  </button>
                  <button
                    onClick={() => navigate(`/articles/${selectedArticle.id}/edit`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    編集
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                  >
                    削除
                  </button>
                </div>

                {/* Memo */}
                {selectedArticle.memo && (
                  <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <p className="text-sm text-gray-700">{selectedArticle.memo}</p>
                  </div>
                )}

                {/* Tags */}
                {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedArticle.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="text-xs text-gray-500">
                  作成: {new Date(selectedArticle.created_at).toLocaleString('ja-JP')}
                  {' | '}
                  更新: {new Date(selectedArticle.updated_at).toLocaleString('ja-JP')}
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <MarkdownRenderer content={selectedArticle.content || ''} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📄</div>
              <div>記事を選択してください</div>
            </div>
          </div>
        )}
      </main>

          {/* Right TOC Sidebar - Desktop only */}
          {selectedArticle?.content && (
            <div className="hidden lg:block">
              <TableOfContents content={selectedArticle.content} />
            </div>
          )}
        </>
      )}

      {/* Table View: Full-width table */}
      {viewMode === 'table' && (
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

          {/* Header with view switcher */}
          <div className="p-4 md:p-8 border-b">
            {/* View Switcher */}
            <div className="mb-4 hidden md:flex">
              {renderViewSwitcher()}
            </div>

            {/* Search Field */}
            <div className="mb-4">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="タイトルやメモから検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="text-sm text-gray-500">
              {filteredArticles.length}件の記事
            </div>
          </div>

          {/* Table */}
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
                          {article.category && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-800">
                              {article.category.name}
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
                <span className="text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>
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
      )}

      {/* Card View: Grid layout */}
      {viewMode === 'card' && (
        <main className="flex-1 bg-gray-50 overflow-y-auto">
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

          {/* Header with view switcher */}
          <div className="p-4 md:p-8 bg-white border-b">
            {/* View Switcher */}
            <div className="mb-4 hidden md:flex">
              {renderViewSwitcher()}
            </div>

            {/* Search Field */}
            <div className="mb-4">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="タイトルやメモから検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="text-sm text-gray-500">
              {filteredArticles.length}件の記事
            </div>
          </div>

          {/* Cards */}
          <ArticleCardView
            articles={paginatedArticles}
            onArticleClick={(article) => navigate(`/articles/${article.id}`)}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="sticky bottom-0 bg-white border-t p-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                前へ
              </button>
              <span className="text-sm text-gray-600">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            </div>
          )}
        </main>
      )}

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
