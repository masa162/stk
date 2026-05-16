import { useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import ScrollTop from '../components/common/ScrollTop'
import GmailView from '../components/article/views/GmailView'
import TableView from '../components/article/views/TableView'
import CardView from '../components/article/views/CardView'
import { useArticles } from '../hooks/useArticles'
import { useTags } from '../hooks/useTags'
import { useDragDrop } from '../hooks/useDragDrop'
import TimelineView from '../components/article/views/TimelineView'
import type { ViewMode } from '../components/common/ViewSwitcher'

const ITEMS_PER_PAGE = 20

export default function ArticleList() {
  const location = useLocation()
  const { data: articles = [], isLoading: loading } = useArticles()
  const { data: allTags = [] } = useTags()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { isDragging, dropMessage, handleDragEnter, handleDragOver, handleDragLeave, handleDrop } = useDragDrop()

  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('articleViewMode')
    return (saved as ViewMode) || 'gmail'
  })

  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)

  // Handle navigation state (from Tags page)
  useEffect(() => {
    if (location.state?.selectedTagId) {
      setSelectedTagId(location.state.selectedTagId)
      setCurrentPage(1)
      // Clear the state to avoid re-applying on subsequent renders
      window.history.replaceState({}, document.title)
    }
  }, [location.state])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sortColumn, setSortColumn] = useState<'title' | 'created_at' | 'updated_at'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Save view mode to localStorage when changed
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('articleViewMode', mode)
  }

  // Filtering with useMemo for performance
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
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
  }, [articles, selectedCategoryId, selectedTagId, searchKeyword])

  // Sorting with useMemo for performance
  const sortedArticles = useMemo(() => {
    return [...filteredArticles].sort((a, b) => {
      const aValue = a[sortColumn] || ''
      const bValue = b[sortColumn] || ''
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredArticles, sortColumn, sortDirection])

  // Pagination
  const totalPages = Math.ceil(sortedArticles.length / ITEMS_PER_PAGE)
  const paginatedArticles = useMemo(() => {
    return sortedArticles.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    )
  }, [sortedArticles, currentPage])

  const handleSort = (column: 'title' | 'created_at' | 'updated_at') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const handleSortDirectionToggle = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  // Common props for all views
  const commonViewProps = {
    viewMode,
    onViewModeChange: handleViewModeChange,
    searchKeyword,
    onSearchChange: setSearchKeyword,
    currentPage,
    totalPages,
    onPageChange: setCurrentPage,
    totalCount: filteredArticles.length,
    onMobileSidebarOpen: () => setMobileSidebarOpen(true)
  }

  return (
    <div
      className="flex h-screen relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-900/80 flex items-center justify-center pointer-events-none">
          <div className="text-white text-2xl font-medium border-2 border-dashed border-blue-400 rounded-2xl px-16 py-12">
            .md / .txt をドロップして追加
          </div>
        </div>
      )}
      {dropMessage && (
        <div className="absolute top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded shadow text-sm">
          {dropMessage}
        </div>
      )}
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
        <GmailView
          {...commonViewProps}
          articles={paginatedArticles}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortColumnChange={setSortColumn}
          onSortDirectionToggle={handleSortDirectionToggle}
        />
      )}

      {/* Table View: Full-width table */}
      {viewMode === 'table' && (
        <TableView
          {...commonViewProps}
          articles={paginatedArticles}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}

      {/* Card View: Grid layout */}
      {viewMode === 'card' && (
        <CardView
          {...commonViewProps}
          articles={paginatedArticles}
        />
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <TimelineView
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          articles={sortedArticles}
          searchKeyword={searchKeyword}
          onSearchChange={setSearchKeyword}
          onMobileSidebarOpen={() => setMobileSidebarOpen(true)}
        />
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

