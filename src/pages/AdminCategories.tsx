import { useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import MobileHeader from '../components/common/MobileHeader'
import ScrollTop from '../components/common/ScrollTop'
import { useCategories } from '../hooks/useCategories'
import { useArticles } from '../hooks/useArticles'
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../hooks/useCategoryMutations'
import { useTags } from '../hooks/useTags'
import { useToast } from '../contexts/ToastContext'

export default function AdminCategories() {
  const toast = useToast()
  const { data: categories = [], isLoading } = useCategories()
  const { data: articles = [] } = useArticles()
  const { data: allTags = [] } = useTags()
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingColor, setEditingColor] = useState('#6B7280')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6B7280')

  // Calculate article count for each category
  const categoriesWithCount = categories.map((category) => ({
    ...category,
    articleCount: articles.filter((article) => article.category_id === category.id).length,
  }))

  const handleEdit = (category: typeof categoriesWithCount[0]) => {
    setEditingId(category.id)
    setEditingName(category.name)
    setEditingColor(category.color)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) return

    updateCategoryMutation.mutate(
      { id: editingId, name: editingName.trim(), color: editingColor },
      {
        onSuccess: () => {
          toast.success('カテゴリを更新しました')
          setEditingId(null)
          setEditingName('')
          setEditingColor('#6B7280')
        },
        onError: (error) => {
          console.error('Failed to update category:', error)
          toast.error('更新に失敗しました')
        },
      }
    )
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
    setEditingColor('#6B7280')
  }

  const handleDelete = (category: typeof categoriesWithCount[0]) => {
    const message =
      category.articleCount === 0
        ? 'このカテゴリを削除しますか？'
        : `このカテゴリは${category.articleCount}件の記事で使用されています。削除しますか？`

    if (!confirm(message)) return

    deleteCategoryMutation.mutate(category.id, {
      onSuccess: () => {
        toast.success('カテゴリを削除しました')
      },
      onError: (error) => {
        console.error('Failed to delete category:', error)
        toast.error('削除に失敗しました')
      },
    })
  }

  const handleCreateCategory = () => {
    if (!newName.trim()) {
      toast.warning('カテゴリ名を入力してください')
      return
    }

    createCategoryMutation.mutate(
      { name: newName.trim(), color: newColor },
      {
        onSuccess: () => {
          toast.success('カテゴリを作成しました')
          setShowNewForm(false)
          setNewName('')
          setNewColor('#6B7280')
        },
        onError: (error) => {
          console.error('Failed to create category:', error)
          toast.error('作成に失敗しました')
        },
      }
    )
  }

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          selectedCategoryId={null}
          selectedTagId={null}
          onCategorySelect={() => {}}
          onTagSelect={() => {}}
          tags={allTags}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        <MobileHeader onMenuClick={() => setMobileSidebarOpen(true)} title="カテゴリ管理" />

        <div className="p-4 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="hidden md:block text-3xl font-bold mb-2">カテゴリ管理</h1>
              <p className="text-sm text-gray-500">{categories.length}個のカテゴリ</p>
            </div>
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {showNewForm ? 'キャンセル' : '新規作成'}
            </button>
          </div>

          {/* New Category Form */}
          {showNewForm && (
            <div className="bg-white rounded-lg border p-4 mb-4">
              <h3 className="font-semibold mb-3">新しいカテゴリ</h3>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    カテゴリ名
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    placeholder="カテゴリ名を入力"
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">色</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="h-10 w-16 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-500">{newColor}</span>
                  </div>
                </div>
                <button
                  onClick={handleCreateCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  作成
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">読み込み中...</div>
          ) : categoriesWithCount.length === 0 ? (
            <div className="text-center py-12 text-gray-500">カテゴリがありません</div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      色
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      カテゴリ名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      記事数
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      作成日
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categoriesWithCount.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {editingId === category.id ? (
                          <input
                            type="color"
                            value={editingColor}
                            onChange={(e) => setEditingColor(e.target.value)}
                            className="h-8 w-12 rounded cursor-pointer"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === category.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit()
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                            className="px-2 py-1 border rounded w-full max-w-xs"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">
                            {category.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            category.articleCount === 0
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {category.articleCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(category.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingId === category.id ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              保存
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              キャンセル
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleDelete(category)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              削除
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-30">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80%]">
            <Sidebar
              selectedCategoryId={null}
              selectedTagId={null}
              onCategorySelect={() => {}}
              onTagSelect={() => {}}
              tags={allTags}
            />
          </div>
        </div>
      )}

      <ScrollTop />
    </div>
  )
}
