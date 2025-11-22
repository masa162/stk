import { useNavigate } from 'react-router-dom'
import type { ArticleMetadata } from '../../lib/db/types'
import MobileHeader from '../MobileHeader'
import Pagination from '../Pagination'
import ViewSwitcher, { type ViewMode } from '../ViewSwitcher'

interface TableViewProps {
  articles: ArticleMetadata[]
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  searchKeyword: string
  onSearchChange: (keyword: string) => void
  sortColumn: 'title' | 'created_at' | 'updated_at'
  sortDirection: 'asc' | 'desc'
  onSort: (column: 'title' | 'created_at' | 'updated_at') => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalCount: number
  onMobileSidebarOpen: () => void
}

export default function TableView({
  articles,
  viewMode,
  onViewModeChange,
  searchKeyword,
  onSearchChange,
  sortColumn,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  onMobileSidebarOpen
}: TableViewProps) {
  const navigate = useNavigate()

  return (
    <main className="flex-1 bg-white overflow-y-auto">
      <MobileHeader onMenuClick={onMobileSidebarOpen} title="記事一覧" />

      {/* Header with view switcher */}
      <div className="p-4 md:p-8 border-b">
        {/* View Switcher */}
        <div className="mb-4 hidden md:flex">
          <ViewSwitcher viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>

        {/* Search Field */}
        <div className="mb-4">
          <input
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

      {/* Table */}
      <div className="p-4 md:p-8">
        {articles.length === 0 ? (
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
                    onClick={() => onSort('title')}
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
                    onClick={() => onSort('created_at')}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    作成日 {sortColumn === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => onSort('updated_at')}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    更新日 {sortColumn === 'updated_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {articles.map((article) => (
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          className="mt-6"
        />
      </div>
    </main>
  )
}
