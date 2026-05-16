import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ArticleMetadata } from '../../../lib/db/types'
import MobileHeader from '../../common/MobileHeader'
import TableOfContents from '../../layout/TableOfContents'
import MarkdownRenderer from '../MarkdownRenderer'
import ViewSwitcher, { type ViewMode } from '../../common/ViewSwitcher'
import { useArticle } from '../../../hooks/useArticle'
import { useDeleteArticle } from '../../../hooks/useArticleMutations'
import { useIsMobile } from '../../../hooks/useMediaQuery'
import { useToast } from '../../../contexts/ToastContext'

interface TimelineViewProps {
  articles: ArticleMetadata[]
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  searchKeyword: string
  onSearchChange: (keyword: string) => void
  onMobileSidebarOpen: () => void
}

function formatMonthKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

export default function TimelineView({
  articles,
  viewMode,
  onViewModeChange,
  searchKeyword,
  onSearchChange,
  onMobileSidebarOpen,
}: TimelineViewProps) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const toast = useToast()
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null)
  const { data: selectedArticle, isLoading: loadingArticle } = useArticle(selectedArticleId)
  const deleteArticleMutation = useDeleteArticle()

  const filtered = useMemo(() => {
    if (!searchKeyword.trim()) return articles
    const kw = searchKeyword.toLowerCase()
    return articles.filter(
      (a) => a.title.toLowerCase().includes(kw) || a.memo?.toLowerCase().includes(kw)
    )
  }, [articles, searchKeyword])

  const grouped = useMemo(() => {
    const map = new Map<string, ArticleMetadata[]>()
    for (const article of filtered) {
      const key = formatMonthKey(article.created_at)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(article)
    }
    return map
  }, [filtered])

  const handleClick = (article: ArticleMetadata) => {
    if (isMobile) {
      navigate(`/articles/${article.id}`)
    } else {
      setSelectedArticleId(article.id === selectedArticleId ? null : article.id)
    }
  }

  const handleDelete = async () => {
    if (!selectedArticle) return
    if (!confirm('この記事をゴミ箱に移動しますか?')) return
    deleteArticleMutation.mutate(selectedArticle.id, {
      onSuccess: () => {
        toast.success('記事をゴミ箱に移動しました')
        setSelectedArticleId(null)
      },
      onError: () => toast.error('削除に失敗しました'),
    })
  }

  const handleExportMarkdown = () => {
    if (!selectedArticle) return
    const content = `---\ntitle: ${selectedArticle.title}\ncreated: ${selectedArticle.created_at}\n---\n\n${selectedArticle.content || ''}`
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

  return (
    <>
      {/* Timeline List Pane */}
      <aside className="w-full md:w-96 lg:w-2/5 bg-white border-r overflow-y-auto flex flex-col">
        <MobileHeader onMenuClick={onMobileSidebarOpen} title="タイムライン" />

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between gap-3">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter..."
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <ViewSwitcher viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>

        {/* Timeline */}
        <div className="flex-1">
          {grouped.size === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">記事がありません</div>
          ) : (
            Array.from(grouped.entries()).map(([month, monthArticles]) => (
              <div key={month}>
                {/* Month Header */}
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-t sticky top-14 z-[5]">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{month}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">{monthArticles.length}件</span>
                </div>

                {/* Articles in this month */}
                <div className="divide-y divide-gray-100">
                  {monthArticles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => handleClick(article)}
                      className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedArticleId === article.id
                          ? 'bg-blue-50 border-l-2 border-l-blue-500'
                          : 'border-l-2 border-l-transparent'
                      }`}
                    >
                      <span className="text-xs text-gray-400 pt-0.5 w-10 shrink-0 font-mono">
                        {formatDay(article.created_at)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 leading-snug truncate">
                          {article.title}
                        </p>
                        {article.memo && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{article.memo}</p>
                        )}
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {article.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag.id}
                                className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded"
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
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Preview Pane */}
      <main className="hidden md:flex flex-1 flex-col bg-white overflow-hidden">
        {loadingArticle ? (
          <div className="flex items-center justify-center h-full text-gray-400">読み込み中...</div>
        ) : selectedArticle ? (
          <>
            <div className="border-b p-6 space-y-3">
              <h1
                onClick={() => navigate(`/articles/${selectedArticle.id}`)}
                className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors"
              >
                {selectedArticle.title}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={handleExportMarkdown}
                  className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                >
                  MD出力
                </button>
                <button
                  onClick={() => navigate(`/articles/${selectedArticle.id}/edit`)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                >
                  編集
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                >
                  削除
                </button>
              </div>
              {selectedArticle.memo && (
                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded text-sm text-gray-700">
                  {selectedArticle.memo}
                </div>
              )}
              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedArticle.tags.map((tag) => (
                    <span key={tag.id} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400">
                {new Date(selectedArticle.created_at).toLocaleString('ja-JP')}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <MarkdownRenderer content={selectedArticle.content || ''} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📅</div>
              <div className="text-sm">記事を選択してください</div>
            </div>
          </div>
        )}
      </main>

      {selectedArticle?.content && (
        <div className="hidden lg:block">
          <TableOfContents content={selectedArticle.content} />
        </div>
      )}
    </>
  )
}
