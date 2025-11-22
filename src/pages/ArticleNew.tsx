import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import ScrollTop from '../components/common/ScrollTop'
import MobileHeader from '../components/common/MobileHeader'
import { useToast } from '../contexts/ToastContext'
import { useTags } from '../hooks/useTags'
import { useCategories } from '../hooks/useCategories'
import { useCreateArticle } from '../hooks/useArticleMutations'

export default function ArticleNew() {
  const navigate = useNavigate()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [memo, setMemo] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [tags, setTags] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const { data: allTags = [] } = useTags()
  const { data: categories = [] } = useCategories()
  const createArticleMutation = useCreateArticle()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast.warning('タイトルと本文は必須です')
      return
    }

    // Parse tags
    const tagArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    createArticleMutation.mutate(
      {
        title,
        content,
        memo: memo || undefined,
        category_id: categoryId || undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
      },
      {
        onSuccess: () => {
          toast.success('記事を作成しました')
          navigate('/')
        },
        onError: (error) => {
          console.error('Failed to create article:', error)
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
        <MobileHeader onMenuClick={() => setMobileSidebarOpen(true)} title="新規記事作成" />

        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="hidden md:block mb-6">
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← 一覧に戻る
            </button>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
            <h1 className="hidden md:block text-2xl md:text-3xl font-bold mb-6">新規記事作成</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="記事のタイトルを入力"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                メモ
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="メモを入力（任意）"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                カテゴリ
              </label>
              <select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">未分類</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                タグ
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例: AI, メモ, アイデア（カンマ区切り）"
              />
              <p className="mt-1 text-xs text-gray-500">
                タグをカンマ区切りで入力してください
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                本文 (Markdown) <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={20}
                placeholder="# 見出し

本文をMarkdown形式で入力してください..."
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Markdown記法が使用できます（見出し、リスト、コードブロックなど）
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '作成中...' : '作成'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>

    {/* Mobile Drawer */}
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
