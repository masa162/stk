import { useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import MobileHeader from '../components/common/MobileHeader'
import ScrollTop from '../components/common/ScrollTop'
import { useTags } from '../hooks/useTags'
import { useUpdateTag, useDeleteTag, useBulkDeleteTags } from '../hooks/useTagMutations'
import { useToast } from '../contexts/ToastContext'

export default function AdminTags() {
  const toast = useToast()
  const { data: tags = [], isLoading } = useTags()
  const updateTagMutation = useUpdateTag()
  const deleteTagMutation = useDeleteTag()
  const bulkDeleteMutation = useBulkDeleteTags()

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set())

  // Filter tags with article_count property
  const tagsWithCount = tags.filter((tag): tag is typeof tag & { article_count: number } =>
    'article_count' in tag
  )

  const emptyTags = tagsWithCount.filter((tag) => tag.article_count === 0)

  const handleEdit = (tag: typeof tagsWithCount[0]) => {
    setEditingId(tag.id)
    setEditingName(tag.name)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) return

    updateTagMutation.mutate(
      { id: editingId, name: editingName.trim() },
      {
        onSuccess: () => {
          toast.success('タグ名を更新しました')
          setEditingId(null)
          setEditingName('')
        },
        onError: (error) => {
          console.error('Failed to update tag:', error)
          toast.error('更新に失敗しました')
        },
      }
    )
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleDelete = (tag: typeof tagsWithCount[0]) => {
    const message =
      tag.article_count === 0
        ? 'このタグを削除しますか？'
        : `このタグは${tag.article_count}件の記事で使用されています。削除しますか？`

    if (!confirm(message)) return

    deleteTagMutation.mutate(tag.id, {
      onSuccess: () => {
        toast.success('タグを削除しました')
      },
      onError: (error) => {
        console.error('Failed to delete tag:', error)
        toast.error('削除に失敗しました')
      },
    })
  }

  const handleToggleSelect = (tagId: number) => {
    const newSelected = new Set(selectedTags)
    if (newSelected.has(tagId)) {
      newSelected.delete(tagId)
    } else {
      newSelected.add(tagId)
    }
    setSelectedTags(newSelected)
  }

  const handleSelectAllEmpty = () => {
    const allEmptyIds = emptyTags.map((tag) => tag.id)
    setSelectedTags(new Set(allEmptyIds))
  }

  const handleDeselectAll = () => {
    setSelectedTags(new Set())
  }

  const handleBulkDelete = () => {
    if (selectedTags.size === 0) {
      toast.warning('削除するタグを選択してください')
      return
    }

    if (!confirm(`${selectedTags.size}件のタグを削除しますか？`)) return

    bulkDeleteMutation.mutate(Array.from(selectedTags), {
      onSuccess: () => {
        toast.success(`${selectedTags.size}件のタグを削除しました`)
        setSelectedTags(new Set())
      },
      onError: (error) => {
        console.error('Failed to bulk delete tags:', error)
        toast.error('一括削除に失敗しました')
      },
    })
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
          tags={tags}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        <MobileHeader onMenuClick={() => setMobileSidebarOpen(true)} title="タグ管理" />

        <div className="p-4 md:p-8">
          <div className="mb-6">
            <h1 className="hidden md:block text-3xl font-bold mb-2">タグ管理</h1>
            <p className="text-sm text-gray-500">
              {tagsWithCount.length}個のタグ（記事なし: {emptyTags.length}個）
            </p>
          </div>

          {/* Bulk Actions */}
          {emptyTags.length > 0 && (
            <div className="bg-white rounded-lg border p-4 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSelectAllEmpty}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  記事なしタグをすべて選択
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  選択解除
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedTags.size === 0}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  選択したタグを削除 ({selectedTags.size})
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">読み込み中...</div>
          ) : tagsWithCount.length === 0 ? (
            <div className="text-center py-12 text-gray-500">タグがありません</div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedTags.size === emptyTags.length && emptyTags.length > 0}
                        onChange={(e) =>
                          e.target.checked ? handleSelectAllEmpty() : handleDeselectAll()
                        }
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      タグ名
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
                  {tagsWithCount.map((tag) => (
                    <tr key={tag.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedTags.has(tag.id)}
                          onChange={() => handleToggleSelect(tag.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {editingId === tag.id ? (
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
                          <span className="text-sm font-medium text-gray-900">{tag.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            tag.article_count === 0
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {tag.article_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(tag.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingId === tag.id ? (
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
                              onClick={() => handleEdit(tag)}
                              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleDelete(tag)}
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
              tags={tags}
            />
          </div>
        </div>
      )}

      <ScrollTop />
    </div>
  )
}
