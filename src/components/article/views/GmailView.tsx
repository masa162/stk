import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Article, ArticleMetadata } from '../../../lib/db/types'
import MobileHeader from '../../common/MobileHeader'
import ArticleListHeader from '../ArticleListHeader'
import Pagination from '../../common/Pagination'
import TableOfContents from '../../layout/TableOfContents'
import MarkdownRenderer from '../MarkdownRenderer'
import ViewSwitcher, { type ViewMode } from '../../common/ViewSwitcher'
import { useArticle } from '../../../hooks/useArticle'
import { useIsMobile } from '../../../hooks/useMediaQuery'
import { useToast } from '../../../contexts/ToastContext'

interface GmailViewProps {
  articles: ArticleMetadata[]
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  searchKeyword: string
  onSearchChange: (keyword: string) => void
  sortColumn: 'title' | 'created_at' | 'updated_at'
  sortDirection: 'asc' | 'desc'
  onSortColumnChange: (column: 'title' | 'created_at' | 'updated_at') => void
  onSortDirectionToggle: () => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onMobileSidebarOpen: () => void
}

export default function GmailView({
  articles,
  viewMode,
  onViewModeChange,
  searchKeyword,
  onSearchChange,
  sortColumn,
  sortDirection,
  onSortColumnChange,
  onSortDirectionToggle,
  currentPage,
  totalPages,
  onPageChange,
  onMobileSidebarOpen
}: GmailViewProps) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const toast = useToast()
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null)
  const { article: selectedArticle, loading: loadingArticle } = useArticle(selectedArticleId)

  const handleArticleClick = (article: ArticleMetadata) => {
    if (isMobile) {
      navigate(`/articles/${article.id}`)
    } else {
      setSelectedArticleId(article.id)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('コピーしました')
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
        toast.success('記事をゴミ箱に移動しました')
        setSelectedArticleId(null)
        window.location.reload() // Refresh to update article list
      } else {
        toast.error('削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete article:', error)
      toast.error('削除に失敗しました')
    }
  }

  return (
    <>
      {/* Article List Pane */}
      <aside className="w-full md:w-96 lg:w-1/3 bg-white border-r overflow-y-auto">
        <MobileHeader onMenuClick={onMobileSidebarOpen} title="記事一覧" />

        <ArticleListHeader
          searchKeyword={searchKeyword}
          onSearchChange={onSearchChange}
          totalCount={articles.length}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortColumnChange={onSortColumnChange}
          onSortDirectionToggle={onSortDirectionToggle}
          showViewSwitcher={true}
          viewSwitcher={<ViewSwitcher viewMode={viewMode} onViewModeChange={onViewModeChange} />}
        />

        {/* Article List */}
        <div className="divide-y divide-gray-200">
          {articles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              記事がありません
            </div>
          ) : (
            articles.map((article) => (
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          className="sticky bottom-0 bg-white border-t p-3"
        />
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
  )
}
