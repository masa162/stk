import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import type { Article } from '../lib/db/types'

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchArticle(parseInt(id))
    }
  }, [id])

  const fetchArticle = async (articleId: number) => {
    try {
      const response = await fetch(`/api/articles/${articleId}`)
      const data = await response.json()
      setArticle(data.article)
    } catch (error) {
      console.error('Failed to fetch article:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">記事が見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← 一覧に戻る
          </button>
        </div>

        <article className="bg-white shadow-md rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

          {article.memo && (
            <div className="mb-6 p-4 bg-yellow-50 rounded">
              <p className="text-sm text-gray-700">{article.memo}</p>
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            <ReactMarkdown
              rehypePlugins={[rehypeHighlight]}
              remarkPlugins={[remarkGfm]}
            >
              {article.content || ''}
            </ReactMarkdown>
          </div>

          <div className="mt-8 pt-8 border-t flex justify-between items-center">
            <div className="text-sm text-gray-500">
              作成: {new Date(article.created_at).toLocaleString('ja-JP')}
              {' | '}
              更新: {new Date(article.updated_at).toLocaleString('ja-JP')}
            </div>
            <button
              onClick={() => navigate(`/articles/${article.id}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              編集
            </button>
          </div>
        </article>
      </div>
    </div>
  )
}
