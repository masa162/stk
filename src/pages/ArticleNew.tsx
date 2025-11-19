import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ArticleNew() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      alert('タイトルと本文は必須です')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + btoa('mn:39'),
        },
        body: JSON.stringify({
          title,
          content,
          memo: memo || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert('記事を作成しました')
        navigate(`/articles/${data.id}`)
      } else {
        alert('作成に失敗しました')
      }
    } catch (error) {
      console.error('Failed to create article:', error)
      alert('作成に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← 一覧に戻る
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">新規記事作成</h1>

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
    </div>
  )
}
