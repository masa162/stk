import { Link, useNavigate } from 'react-router-dom'
import { useCategories } from '../../hooks/useCategories'
import { useArticles } from '../../hooks/useArticles'

interface Tag {
  id: number
  name: string
}

interface SidebarProps {
  selectedCategoryId: number | null
  selectedTagId: number | null
  onCategorySelect: (id: number | null) => void
  onTagSelect: (id: number | null) => void
  tags: Tag[]
}

export default function Sidebar({
  selectedCategoryId,
  selectedTagId,
  onCategorySelect,
  onTagSelect,
  tags,
}: SidebarProps) {
  const { data: categories = [] } = useCategories()
  const { data: articles = [] } = useArticles()
  const navigate = useNavigate()

  const handleRandom = () => {
    if (articles.length === 0) return
    const pick = articles[Math.floor(Math.random() * articles.length)]
    navigate(`/articles/${pick.id}`)
  }

  const handleTodayInHistory = () => {
    const today = new Date()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const currentYear = today.getFullYear()

    const sameDay = articles.filter((a) => {
      const d = new Date(a.created_at)
      if (d.getFullYear() >= currentYear) return false
      return (
        String(d.getMonth() + 1).padStart(2, '0') === mm &&
        String(d.getDate()).padStart(2, '0') === dd
      )
    })

    if (sameDay.length > 0) {
      navigate(`/articles/${sameDay[Math.floor(Math.random() * sameDay.length)].id}`)
      return
    }

    // 同日なければ同月の過去記事からランダム
    const sameMonth = articles.filter((a) => {
      const d = new Date(a.created_at)
      return (
        d.getFullYear() < currentYear &&
        String(d.getMonth() + 1).padStart(2, '0') === mm
      )
    })

    if (sameMonth.length > 0) {
      navigate(`/articles/${sameMonth[Math.floor(Math.random() * sameMonth.length)].id}`)
    }
  }

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col overflow-y-auto">
      {/* Logo / Home */}
      <div className="p-4 border-b border-gray-700">
        <Link to="/" className="block hover:opacity-80 transition-opacity">
          <div className="text-2xl font-bold text-center">STK</div>
          <div className="text-xs text-gray-400 text-center mt-1">
            Knowledge Hub
          </div>
        </Link>
      </div>

      {/* Navigation Buttons */}
      <div className="p-4 space-y-2 border-b border-gray-700">
        <Link
          to="/quick"
          className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-center font-medium transition-colors"
        >
          Quick
        </Link>
        <Link
          to="/articles/new"
          className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors text-sm"
        >
          新規記事作成
        </Link>
        <Link
          to="/tags"
          className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors"
        >
          タグ一覧
        </Link>
        <Link
          to="/search"
          className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors"
        >
          検索
        </Link>
        <Link
          to="/trash"
          className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors"
        >
          ゴミ箱
        </Link>
      </div>

      {/* Discovery */}
      <div className="p-4 space-y-2 border-b border-gray-700">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">発見</h3>
        <button
          onClick={handleRandom}
          className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors text-sm"
        >
          🎲 ランダム
        </button>
        <button
          onClick={handleTodayInHistory}
          className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors text-sm"
        >
          📅 今日は何の日
        </button>
      </div>

      {/* Admin Menu */}
      <div className="p-4 space-y-2 border-b border-gray-700">
        <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase">
          管理
        </h3>
        <Link
          to="/admin/tags"
          className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors text-sm"
        >
          タグ管理
        </Link>
        <Link
          to="/admin/categories"
          className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors text-sm"
        >
          カテゴリ管理
        </Link>
      </div>

      {/* Category Filter */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase">
          カテゴリ
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => onCategorySelect(null)}
            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
              selectedCategoryId === null
                ? 'bg-blue-600'
                : 'hover:bg-gray-800'
            }`}
          >
            すべて
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                selectedCategoryId === category.id
                  ? 'bg-blue-600'
                  : 'hover:bg-gray-800'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <span className="truncate">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tag Filter */}
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase">
          タグ
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => onTagSelect(null)}
            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
              selectedTagId === null ? 'bg-blue-600' : 'hover:bg-gray-800'
            }`}
          >
            すべて
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onTagSelect(tag.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                selectedTagId === tag.id
                  ? 'bg-blue-600'
                  : 'hover:bg-gray-800'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
