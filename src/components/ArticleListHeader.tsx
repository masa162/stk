interface ArticleListHeaderProps {
  searchKeyword: string
  onSearchChange: (keyword: string) => void
  totalCount: number
  sortColumn?: 'title' | 'created_at' | 'updated_at'
  sortDirection?: 'asc' | 'desc'
  onSortColumnChange?: (column: 'title' | 'created_at' | 'updated_at') => void
  onSortDirectionToggle?: () => void
  showViewSwitcher?: boolean
  viewSwitcher?: React.ReactNode
}

export default function ArticleListHeader({
  searchKeyword,
  onSearchChange,
  totalCount,
  sortColumn,
  sortDirection,
  onSortColumnChange,
  onSortDirectionToggle,
  showViewSwitcher = false,
  viewSwitcher
}: ArticleListHeaderProps) {
  return (
    <div className="sticky top-0 md:top-0 z-10 bg-white border-b p-4">
      {/* View Switcher - Desktop only */}
      {showViewSwitcher && viewSwitcher && (
        <div className="hidden md:flex mb-3">
          {viewSwitcher}
        </div>
      )}

      {/* Search Field */}
      <div className="mb-3">
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="タイトルやメモから検索..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-500">
          {totalCount}件の記事
        </div>
        {sortColumn && sortDirection && onSortColumnChange && onSortDirectionToggle && (
          <div className="flex gap-2">
            <select
              value={sortColumn}
              onChange={(e) => onSortColumnChange(e.target.value as 'title' | 'created_at' | 'updated_at')}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value="created_at">作成日</option>
              <option value="updated_at">更新日</option>
              <option value="title">タイトル</option>
            </select>
            <button
              onClick={onSortDirectionToggle}
              className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
