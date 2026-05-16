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

function getYear(dateStr: string) {
  return String(new Date(dateStr).getFullYear())
}
function getMonthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function formatMonthLabel(key: string) {
  const [, m] = key.split('-')
  return `${parseInt(m)}月`
}
function formatDay(dateStr: string) {
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

  const currentYear = String(new Date().getFullYear())
  const currentMonthKey = getMonthKey(new Date().toISOString())

  const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set())
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set())

  const toggleYear = (year: string) => {
    setCollapsedYears((prev) => {
      const next = new Set(prev)
      next.has(year) ? next.delete(year) : next.add(year)
      return next
    })
  }
  const toggleMonth = (key: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const filtered = useMemo(() => {
    if (!searchKeyword.trim()) return articles
    const kw = searchKeyword.toLowerCase()
    return articles.filter(
      (a) => a.title.toLowerCase().includes(kw) || a.memo?.toLowerCase().includes(kw)
    )
  }, [articles, searchKeyword])

  // Build: year → monthKey → articles[]
  const grouped = useMemo(() => {
    const yearMap = new Map<string, Map<string, ArticleMetadata[]>>()
    for (const article of filtered) {
      const year = getYear(article.created_at)
      const mKey = getMonthKey(article.created_at)
      if (!yearMap.has(year)) yearMap.set(year, new Map())
      const monthMap = yearMap.get(year)!
      if (!monthMap.has(mKey)) monthMap.set(mKey, [])
      monthMap.get(mKey)!.push(article)
    }
    return yearMap
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
      <aside className="w-full md:w-80 lg:w-96 bg-white border-r overflow-y-auto flex flex-col">
        <MobileHeader onMenuClick={onMobileSidebarOpen} title="タイムライン" />

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter..."
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <ViewSwitcher viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>

        {/* Tree */}
        <div className="flex-1 py-2">
          {grouped.size === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">記事がありません</div>
          ) : (
            Array.from(grouped.entries()).map(([year, monthMap]) => {
              const yearTotal = Array.from(monthMap.values()).reduce((s, a) => s + a.length, 0)
              const yearCollapsed = collapsedYears.has(year)

              return (
                <div key={year}>
                  {/* Year row */}
                  <button
                    onClick={() => toggleYear(year)}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-gray-400 text-xs w-3 shrink-0">
                      {yearCollapsed ? '▶' : '▼'}
                    </span>
                    <span className="font-bold text-sm text-gray-800">{year}年</span>
                    <span className="text-xs text-gray-400 ml-auto">({yearTotal})</span>
                  </button>

                  {!yearCollapsed && (
                    <div className="ml-3">
                      {Array.from(monthMap.entries()).map(([mKey, monthArticles]) => {
                        const monthCollapsed = collapsedMonths.has(mKey)
                        const isCurrentMonth = mKey === currentMonthKey

                        return (
                          <div key={mKey}>
                            {/* Month row */}
                            <button
                              onClick={() => toggleMonth(mKey)}
                              className={`w-full flex items-center gap-2 px-4 py-1.5 hover:bg-gray-50 transition-colors text-left ${
                                isCurrentMonth ? 'text-blue-600' : ''
                              }`}
                            >
                              <span className="text-gray-400 text-xs w-3 shrink-0">
                                {monthCollapsed ? '▶' : '▼'}
                              </span>
                              <span className={`text-sm ${isCurrentMonth ? 'font-semibold text-blue-600' : 'text-gray-600'}`}>
                                {formatMonthLabel(mKey)}
                              </span>
                              <span className="text-xs text-gray-400 ml-auto">({monthArticles.length})</span>
                            </button>

                            {/* Articles */}
                            {!monthCollapsed && (
                              <div className="ml-3 border-l border-gray-100">
                                {monthArticles.map((article) => (
                                  <div
                                    key={article.id}
                                    onClick={() => handleClick(article)}
                                    className={`flex gap-2 px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                                      selectedArticleId === article.id
                                        ? 'bg-blue-50 border-l-2 border-l-blue-500 -ml-px'
                                        : ''
                                    }`}
                                  >
                                    <span className="text-xs text-gray-400 pt-0.5 shrink-0 font-mono w-9">
                                      {formatDay(article.created_at).slice(3)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-800 leading-snug line-clamp-2">
                                        {article.title}
                                      </p>
                                      {article.tags && article.tags.length > 0 && (
                                        <div className="flex gap-1 mt-0.5 flex-wrap">
                                          {article.tags.slice(0, 2).map((tag) => (
                                            <span key={tag.id} className="text-xs px-1 py-0 bg-blue-100 text-blue-700 rounded">
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
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
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
                <button onClick={handleExportMarkdown} className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-xs">MD出力</button>
                <button onClick={() => navigate(`/articles/${selectedArticle.id}/edit`)} className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs">編集</button>
                <button onClick={handleDelete} className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs">削除</button>
              </div>
              {selectedArticle.memo && (
                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded text-sm text-gray-700">
                  {selectedArticle.memo}
                </div>
              )}
              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedArticle.tags.map((tag) => (
                    <span key={tag.id} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">{tag.name}</span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400">{new Date(selectedArticle.created_at).toLocaleString('ja-JP')}</p>
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
