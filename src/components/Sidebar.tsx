import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

interface Category {
  id: number
  name: string
  color: string
  display_order: number
}

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
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: {
          Authorization: 'Basic ' + btoa('mn:39'),
        },
      })
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
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
          to="/articles/new"
          className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-center font-medium transition-colors"
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
