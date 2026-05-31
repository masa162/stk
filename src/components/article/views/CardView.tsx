import { useNavigate } from 'react-router-dom'
import type { ArticleMetadata } from '../../../lib/db/types'
import MobileHeader from '../../common/MobileHeader'
import ArticleCardView from '../ArticleCardView'
import Pagination from '../../common/Pagination'
import ViewSwitcher, { type ViewMode } from '../../common/ViewSwitcher'

interface CardViewProps {
  articles: ArticleMetadata[]
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  searchKeyword: string
  onSearchChange: (keyword: string) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalCount: number
  onMobileSidebarOpen: () => void
}

export default function CardView({
  articles,
  viewMode,
  onViewModeChange,
  searchKeyword,
  onSearchChange,
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  onMobileSidebarOpen
}: CardViewProps) {
  const navigate = useNavigate()

  return (
    <main className="flex-1 bg-gray-50 overflow-y-auto">
      <MobileHeader onMenuClick={onMobileSidebarOpen} title="記事一覧" />

      {/* Header with view switcher */}
      <div className="p-4 md:p-8 bg-white border-b">
        {/* View Switcher */}
        <div className="mb-4 hidden md:flex">
          <ViewSwitcher viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>

        {/* Search Field */}
        <div className="mb-4">
          <input
            id="stk-search-input"
            type="text"
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="タイトルやメモから検索..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="text-sm text-gray-500">
          {totalCount}件の記事
        </div>
      </div>

      {/* Cards */}
      <ArticleCardView
        articles={articles}
        onArticleClick={(article) => navigate(`/articles/${article.id}`)}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        className="sticky bottom-0 bg-white border-t p-4"
      />
    </main>
  )
}
