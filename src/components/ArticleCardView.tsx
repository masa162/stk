import type { ArticleMetadata } from '../lib/db/types'

interface ArticleCardViewProps {
  articles: ArticleMetadata[]
  onArticleClick: (article: ArticleMetadata) => void
}

export default function ArticleCardView({ articles, onArticleClick }: ArticleCardViewProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        記事がありません
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 md:p-8">
      {articles.map((article) => {
        const hasThumbnail = !!article.thumbnail_url

        return (
          <div
            key={article.id}
            onClick={() => onArticleClick(article)}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          >
            {/* Thumbnail or Excerpt */}
            {hasThumbnail ? (
              <div className="w-full h-48 bg-gray-100">
                <img
                  src={article.thumbnail_url}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // If image fails to load, hide it and show excerpt/placeholder instead
                    e.currentTarget.parentElement!.innerHTML = `
                      <div class="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
                        <div class="text-sm text-gray-700 text-center line-clamp-6">
                          ${article.excerpt || '📄'}
                        </div>
                      </div>
                    `
                  }}
                />
              </div>
            ) : article.excerpt ? (
              <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
                <p className="text-sm text-gray-700 text-center line-clamp-6">
                  {article.excerpt}
                </p>
              </div>
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                <div className="text-4xl text-blue-300">📄</div>
              </div>
            )}

            {/* Card Content */}
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                {article.title}
              </h3>

              {article.memo && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {article.memo}
                </p>
              )}

              {/* Tags and Category */}
              <div className="flex flex-wrap items-center gap-1 mb-2">
                {article.category && (
                  <span className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">
                    {article.category.name}
                  </span>
                )}
                {article.tags?.slice(0, 2).map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                  >
                    {tag.name}
                  </span>
                ))}
                {article.tags && article.tags.length > 2 && (
                  <span className="text-xs text-gray-500">+{article.tags.length - 2}</span>
                )}
              </div>

              {/* Date */}
              <div className="text-xs text-gray-500">
                {new Date(article.updated_at).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
