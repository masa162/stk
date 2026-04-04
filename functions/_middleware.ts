import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { basicAuth } from 'hono/basic-auth'
import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getTrashedArticles,
  restoreArticle,
  getAllTags,
  updateTag,
  deleteTag,
  bulkDeleteTags,
  searchArticles,
} from '../src/lib/db/d1'
import { ArticleStorage } from '../src/lib/storage'

type Env = {
  DB: D1Database
  ARTICLES_BUCKET: R2Bucket
  ARTICLE_CACHE: KVNamespace
  BASIC_AUTH_USER?: string
  BASIC_AUTH_PASSWORD?: string
  ASSETS: Fetcher
}

interface MaxOrderResult {
  max_order: number | null
}

const app = new Hono<{ Bindings: Env }>({ strict: false })

// Basic認証ミドルウェア（すべてのリクエストに適用）
app.use('*', async (c, next) => {
  const user = c.env.BASIC_AUTH_USER
  const pass = c.env.BASIC_AUTH_PASSWORD

  if (!user || !pass) {
    console.error('BASIC_AUTH_USER and BASIC_AUTH_PASSWORD environment variables must be set')
    return c.text('Server configuration error', 500)
  }

  const auth = basicAuth({
    username: user,
    password: pass,
  })

  return auth(c, next)
})

// CORS設定
app.use('/api/*', cors())

// GET /api/articles - 記事一覧取得
app.get('/api/articles', async (c) => {
  try {
    const storage = new ArticleStorage({ bucket: c.env.ARTICLES_BUCKET })
    const articles = await getArticles(c.env.DB, storage, c.env.ARTICLE_CACHE)
    return c.json({ articles })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return c.json({ error: 'Failed to fetch articles' }, 500)
  }
})

// GET /api/articles/:id - 記事詳細取得
app.get('/api/articles/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const storage = new ArticleStorage({ bucket: c.env.ARTICLES_BUCKET })
    const article = await getArticleById(c.env.DB, storage, id)

    if (!article) {
      return c.json({ error: 'Article not found' }, 404)
    }

    return c.json({ article })
  } catch (error) {
    console.error('Error fetching article:', error)
    return c.json({ error: 'Failed to fetch article' }, 500)
  }
})

// POST /api/articles - 記事作成
app.post('/api/articles', async (c) => {
  try {
    const body = await c.req.json<{
      title: string
      content: string
      memo?: string
      tags?: string[]
      category_id?: number | null
    }>()

    const { title, content, memo, tags, category_id } = body

    if (!title || !content) {
      return c.json({ error: 'Title and content are required' }, 400)
    }

    const storage = new ArticleStorage({ bucket: c.env.ARTICLES_BUCKET })
    const articleId = await createArticle(c.env.DB, storage, {
      title,
      content,
      memo,
      tags,
      category_id,
    })

    // Invalidate KV cache for new article
    await c.env.ARTICLE_CACHE.delete(`article:${articleId}:meta`)

    return c.json({ id: articleId }, 201)
  } catch (error) {
    console.error('Error creating article:', error)
    return c.json({ error: 'Failed to create article' }, 500)
  }
})

// PUT /api/articles/:id - 記事更新
app.put('/api/articles/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<{
      title?: string
      content?: string
      memo?: string
      tags?: string[]
      category_id?: number | null
    }>()

    const storage = new ArticleStorage({ bucket: c.env.ARTICLES_BUCKET })
    const article = await updateArticle(c.env.DB, storage, id, body)

    if (!article) {
      return c.json({ error: 'Article not found' }, 404)
    }

    // Invalidate KV cache for updated article
    await c.env.ARTICLE_CACHE.delete(`article:${id}:meta`)

    return c.json({ article })
  } catch (error) {
    console.error('Error updating article:', error)
    return c.json({ error: 'Failed to update article' }, 500)
  }
})

// DELETE /api/articles/:id - 記事削除（ゴミ箱へ）
app.delete('/api/articles/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const success = await deleteArticle(c.env.DB, id)

    if (!success) {
      return c.json({ error: 'Article not found' }, 404)
    }

    return c.json({ success: true, message: `Article ${id} moved to trash` })
  } catch (error) {
    console.error('Error deleting article:', error)
    return c.json({ error: 'Failed to delete article' }, 500)
  }
})

// GET /api/trash - ゴミ箱の記事一覧
app.get('/api/trash', async (c) => {
  try {
    const articles = await getTrashedArticles(c.env.DB)
    return c.json({ articles })
  } catch (error) {
    console.error('Error fetching trashed articles:', error)
    return c.json({ error: 'Failed to fetch trashed articles' }, 500)
  }
})

// POST /api/trash/:id - 記事を復元
app.post('/api/trash/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const success = await restoreArticle(c.env.DB, id)

    if (!success) {
      return c.json({ error: 'Article not found' }, 404)
    }

    return c.json({ success: true, message: `Article ${id} restored` })
  } catch (error) {
    console.error('Error restoring article:', error)
    return c.json({ error: 'Failed to restore article' }, 500)
  }
})

// GET /api/tags - タグ一覧
app.get('/api/tags', async (c) => {
  try {
    const tags = await getAllTags(c.env.DB)
    return c.json({ tags })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return c.json({ error: 'Failed to fetch tags' }, 500)
  }
})

// PUT /api/tags/:id - タグ名更新
app.put('/api/tags/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const { name } = await c.req.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return c.json({ error: 'Tag name is required' }, 400)
    }

    await updateTag(c.env.DB, id, name.trim())
    return c.json({ message: 'Tag updated successfully' })
  } catch (error) {
    console.error('Error updating tag:', error)
    return c.json({ error: 'Failed to update tag' }, 500)
  }
})

// DELETE /api/tags/:id - タグ削除
app.delete('/api/tags/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    await deleteTag(c.env.DB, id)
    return c.json({ message: 'Tag deleted successfully' })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return c.json({ error: 'Failed to delete tag' }, 500)
  }
})

// POST /api/tags/bulk-delete - タグ一括削除
app.post('/api/tags/bulk-delete', async (c) => {
  try {
    const { tagIds } = await c.req.json()

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return c.json({ error: 'Tag IDs array is required' }, 400)
    }

    await bulkDeleteTags(c.env.DB, tagIds)
    return c.json({ message: `${tagIds.length} tags deleted successfully` })
  } catch (error) {
    console.error('Error bulk deleting tags:', error)
    return c.json({ error: 'Failed to bulk delete tags' }, 500)
  }
})

// GET /api/search - 記事検索
app.get('/api/search', async (c) => {
  try {
    const query = c.req.query('q') || ''
    const articles = await searchArticles(c.env.DB, query)
    return c.json({ articles, query })
  } catch (error) {
    console.error('Error searching articles:', error)
    return c.json({ error: 'Failed to search articles' }, 500)
  }
})

// GET /api/categories - カテゴリ一覧
app.get('/api/categories', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT id, name, parent_id, color, display_order, created_at, updated_at
       FROM categories
       ORDER BY display_order ASC, name ASC`
    ).all()

    return c.json({ categories: results })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return c.json({ error: 'Failed to fetch categories' }, 500)
  }
})

// POST /api/categories - カテゴリ作成
app.post('/api/categories', async (c) => {
  try {
    const body = await c.req.json<{
      name: string
      parent_id?: number | null
      color?: string
    }>()

    const { name, parent_id, color } = body

    if (!name) {
      return c.json({ error: 'Category name is required' }, 400)
    }

    const { results: orderResults } = await c.env.DB.prepare(
      'SELECT MAX(display_order) as max_order FROM categories'
    ).all()

    const maxOrder = (orderResults[0] as MaxOrderResult)?.max_order ?? 0

    const result = await c.env.DB.prepare(
      `INSERT INTO categories (name, parent_id, color, display_order)
       VALUES (?, ?, ?, ?)`
    )
      .bind(name, parent_id || null, color || '#6B7280', maxOrder + 1)
      .run()

    return c.json({ id: result.meta.last_row_id, message: 'Category created' }, 201)
  } catch (error) {
    console.error('Error creating category:', error)
    return c.json({ error: 'Failed to create category' }, 500)
  }
})

// PUT /api/categories/:id - カテゴリ更新
app.put('/api/categories/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<{ name: string; color?: string }>()
    const { name, color } = body

    await c.env.DB.prepare(
      `UPDATE categories
       SET name = ?, color = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(name, color || '#6B7280', id)
      .run()

    return c.json({ message: 'Category updated' })
  } catch (error) {
    console.error('Error updating category:', error)
    return c.json({ error: 'Failed to update category' }, 500)
  }
})

// DELETE /api/categories/:id - カテゴリ削除
app.delete('/api/categories/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()

    return c.json({ message: 'Category deleted' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return c.json({ error: 'Failed to delete category' }, 500)
  }
})

// POST /api/categories/reorder - カテゴリ並び替え
app.post('/api/categories/reorder', async (c) => {
  try {
    const body = await c.req.json<{ categoryIds: number[] }>()
    const { categoryIds } = body

    if (!Array.isArray(categoryIds)) {
      return c.json({ error: 'Category IDs array is required' }, 400)
    }

    for (let i = 0; i < categoryIds.length; i++) {
      await c.env.DB.prepare('UPDATE categories SET display_order = ? WHERE id = ?')
        .bind(i + 1, categoryIds[i])
        .run()
    }

    return c.json({ message: 'Order updated' })
  } catch (error) {
    console.error('Error reordering categories:', error)
    return c.json({ error: 'Failed to reorder categories' }, 500)
  }
})

// 静的ファイルも含めてすべてのリクエストを処理
app.all('*', async (c) => {
  // 静的ファイルを配信
  return c.env.ASSETS.fetch(c.req.raw)
})

export const onRequest: PagesFunction<Env> = async (context) => {
  // すべてのリクエストをHonoで処理（認証が適用される）
  return app.fetch(context.request, context.env, context)
}
