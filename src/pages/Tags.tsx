import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import MobileHeader from '../components/common/MobileHeader'
import ScrollTop from '../components/common/ScrollTop'
import { useTags } from '../hooks/useTags'
import { useArticles } from '../hooks/useArticles'

export default function Tags() {
  const navigate = useNavigate()
  const { data: tags = [], isLoading: loadingTags } = useTags()
  const { data: articles = [] } = useArticles()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Calculate article count for each tag
  const tagsWithCount = tags.map((tag) => ({
    ...tag,
    articleCount: articles.filter((article) =>
      article.tags?.some((t) => t.id === tag.id)
    ).length,
  }))

  // Sort by article count (descending)
  const sortedTags = [...tagsWithCount].sort(
    (a, b) => b.articleCount - a.articleCount
  )

  const handleTagClick = (tagId: number) => {
    // Navigate to home with tag filter
    navigate('/', { state: { selectedTagId: tagId } })
  }

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          selectedCategoryId={null}
          selectedTagId={null}
          onCategorySelect={() => {}}
          onTagSelect={(tagId) => tagId && navigate('/', { state: { selectedTagId: tagId } })}
          tags={tags}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        <MobileHeader onMenuClick={() => setMobileSidebarOpen(true)} title="タグ一覧" />

        <div className="p-4 md:p-8">
          <h1 className="hidden md:block text-3xl font-bold mb-6">タグ一覧</h1>

          {loadingTags ? (
            <div className="text-center py-12 text-gray-500">読み込み中...</div>
          ) : sortedTags.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              タグがありません
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-500 mb-4">
                {sortedTags.length}個のタグ
              </div>

              {/* Tags Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedTags.map((tag) => (
                  <div
                    key={tag.id}
                    onClick={() => handleTagClick(tag.id)}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {tag.name}
                      </h3>
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {tag.articleCount}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {tag.articleCount === 0
                        ? '記事なし'
                        : `${tag.articleCount}件の記事`}
                    </p>
                  </div>
                ))}
              </div>
            </>
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
              onTagSelect={(tagId) => {
                setMobileSidebarOpen(false)
                tagId && navigate('/', { state: { selectedTagId: tagId } })
              }}
              tags={tags}
            />
          </div>
        </div>
      )}

      <ScrollTop />
    </div>
  )
}
