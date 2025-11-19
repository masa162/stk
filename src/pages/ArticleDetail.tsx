import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Article, Tag } from '../lib/db/types'
import Sidebar from '../components/Sidebar'
import TableOfContents from '../components/TableOfContents'
import MarkdownRenderer from '../components/MarkdownRenderer'
import ScrollTop from '../components/ScrollTop'

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (id) {
      fetchArticle(parseInt(id))
      fetchTags()
    }
  }, [id])

  const fetchArticle = async (articleId: number) => {
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        headers: {
          Authorization: 'Basic ' + btoa('mn:39'),
        },
      })
      const data = await response.json()
      setArticle(data.article)
    } catch (error) {
      console.error('Failed to fetch article:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags', {
        headers: {
          Authorization: 'Basic ' + btoa('mn:39'),
        },
      })
      const data = await response.json()
      setAllTags(data.tags || [])
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const handleExportMarkdown = () => {
    if (!article) return

    // Create markdown content with frontmatter
    const frontmatter = `---
title: ${article.title}
created: ${article.created_at}
updated: ${article.updated_at}
${article.memo ? `memo: ${article.memo}` : ''}
tags: ${article.tags?.map((t) => t.name).join(', ') || ''}
---

`
    const content = frontmatter + (article.content || '')

    // Create download
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${article.title}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!article) return
    if (!confirm('この記事をゴミ箱に移動しますか？')) return

    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Basic ' + btoa('mn:39'),
        },
      })

      if (response.ok) {
        alert('記事をゴミ箱に移動しました')
        navigate('/')
      } else {
        alert('削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete article:', error)
      alert('削除に失敗しました')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('コピーしました')
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
      <main className="flex-1 bg-white overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-20 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="text-2xl"
              aria-label="Open menu"
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold truncate">{article.title}</h1>
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 text-sm"
            >
              一覧
            </button>
          </div>
        </div>

        {/* Article Header */}
        <div className="border-b">
          <div className="p-4 md:p-8">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold mb-4">{article.title}</h1>

            {/* ID with copy button */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">ID: {article.id}</span>
              <button
                onClick={() => copyToClipboard(article.id.toString())}
                className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
              >
                コピー
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleExportMarkdown}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
              >
                MD出力
              </button>
              <button
                onClick={() => navigate(`/articles/${article.id}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                編集
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
              >
                削除
              </button>
            </div>

            {/* Memo */}
            {article.memo && (
              <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-sm text-gray-700">{article.memo}</p>
              </div>
            )}

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-gray-500">
              作成: {new Date(article.created_at).toLocaleString('ja-JP')}
              {' | '}
              更新: {new Date(article.updated_at).toLocaleString('ja-JP')}
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="p-4 md:p-8">
          <MarkdownRenderer content={article.content || ''} />
        </div>
      </main>

      {/* Right TOC Sidebar - Desktop only */}
      {article.content && (
        <div className="hidden md:block">
          <TableOfContents content={article.content} />
        </div>
      )}

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
