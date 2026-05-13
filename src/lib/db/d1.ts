import { Article, ArticleMetadata, Tag } from "./types";
import { ArticleStorage } from "../storage";
import { extractFirstImageUrl, extractExcerpt, extractYouTubeVideoId, getYouTubeThumbnailUrl } from "../markdown-utils";

export interface Env {
  DB: D1Database;
  ARTICLES_BUCKET: R2Bucket;
  ARTICLE_CACHE: KVNamespace;
}

interface ArticleMetaCache {
  thumbnail_url: string | null;
  excerpt: string | null;
}

const KV_TTL = 60 * 60 * 24 * 7;
const LIST_CACHE_KEY = 'articles:list:v1';
const LIST_CACHE_TTL = 10 * 60;

interface ArticleTagRow {
  article_id: number;
  id: number;
  name: string;
  created_at: string;
}

interface CategoryRow {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

/**
 * Get all articles with metadata, thumbnail, and excerpt
 * Optimized: KV cache for thumbnail/excerpt, batch DB queries
 */
export async function getArticles(db: D1Database, storage: ArticleStorage, kv?: KVNamespace): Promise<ArticleMetadata[]> {
  if (kv) {
    try {
      const cached = await kv.get(LIST_CACHE_KEY, 'json') as ArticleMetadata[] | null;
      if (cached !== null) return cached;
    } catch (_) {}
  }

  // Fetch metadata only (exclude content column)
  const { results } = await db
    .prepare(
      `
      SELECT
        id, title, content_key, content_size, content_hash, memo,
        category_id,
        created_at, updated_at, deleted_at
      FROM articles
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `
    )
    .all();

  const articles = results as unknown as ArticleMetadata[];
  const articleIds = articles.map((a) => a.id);

  if (articleIds.length === 0) return [];

  // Batch load tags (solve N+1 problem)
  // D1 has a limit on SQL variables, so we need to batch them
  const tagMap = new Map<number, Tag[]>();
  const BATCH_SIZE = 50; // Safe limit for SQL variables

  for (let i = 0; i < articleIds.length; i += BATCH_SIZE) {
    const batch = articleIds.slice(i, i + BATCH_SIZE);
    const placeholders = batch.map(() => "?").join(",");

    const { results: tagResults } = await db
      .prepare(
        `
        SELECT at.article_id, t.id, t.name, t.created_at
        FROM article_tags at
        INNER JOIN tags t ON at.tag_id = t.id
        WHERE at.article_id IN (${placeholders})
      `
      )
      .bind(...batch)
      .all();

    // Map tags to articles
    for (const row of tagResults as ArticleTagRow[]) {
      if (!tagMap.has(row.article_id)) {
        tagMap.set(row.article_id, []);
      }
      tagMap.get(row.article_id)!.push({
        id: row.id,
        name: row.name,
        created_at: row.created_at,
      });
    }
  }

  // Batch load categories (solve N+1 problem)
  const categoryIds = [...new Set(articles.map(a => a.category_id).filter((id): id is number => id !== null))];
  const categoryMap = new Map<number, any>();

  if (categoryIds.length > 0) {
    for (let i = 0; i < categoryIds.length; i += BATCH_SIZE) {
      const batch = categoryIds.slice(i, i + BATCH_SIZE);
      const placeholders = batch.map(() => "?").join(",");

      const { results: categoryResults } = await db
        .prepare(
          `
          SELECT id, name, color, created_at
          FROM categories
          WHERE id IN (${placeholders})
        `
        )
        .bind(...batch)
        .all();

      for (const row of categoryResults as CategoryRow[]) {
        categoryMap.set(row.id, {
          id: row.id,
          name: row.name,
          color: row.color,
          created_at: row.created_at,
        });
      }
    }
  }

  // Attach tags and categories to articles
  for (const article of articles) {
    article.tags = tagMap.get(article.id) || [];
    article.category = article.category_id ? categoryMap.get(article.category_id) : undefined;
  }

  // Fetch thumbnail + excerpt: KV cache first, R2 as fallback
  await Promise.all(
    articles.map(async (article) => {
      article.thumbnail_url = null;
      article.excerpt = null;

      if (!article.content_key) return;

      const cacheKey = `article:${article.id}:meta`;

      // Check KV cache first
      if (kv) {
        try {
          const cached = await kv.get(cacheKey, 'json') as ArticleMetaCache | null;
          if (cached !== null) {
            article.thumbnail_url = cached.thumbnail_url;
            article.excerpt = cached.excerpt;
            return;
          }
        } catch (e) {
          // KV miss or error, fall through to R2
        }
      }

      // Cache miss: fetch from R2
      try {
        const content = await storage.getContent(article.content_key);

        if (content) {
          article.thumbnail_url = extractFirstImageUrl(content);

          if (!article.thumbnail_url) {
            const videoId = extractYouTubeVideoId(content);
            if (videoId) {
              article.thumbnail_url = getYouTubeThumbnailUrl(videoId);
            }
          }

          article.excerpt = extractExcerpt(content, 100);

          // Store in KV for future requests
          if (kv) {
            const toCache: ArticleMetaCache = {
              thumbnail_url: article.thumbnail_url,
              excerpt: article.excerpt,
            };
            kv.put(cacheKey, JSON.stringify(toCache), { expirationTtl: KV_TTL }).catch(() => {});
          }
        }
      } catch (error) {
        console.error(`Failed to fetch content for article ${article.id}:`, error);
      }
    })
  );

  if (kv) {
    kv.put(LIST_CACHE_KEY, JSON.stringify(articles), { expirationTtl: LIST_CACHE_TTL }).catch(() => {});
  }

  return articles;
}

/**
 * Get article by ID with content from R2
 */
export async function getArticleById(
  db: D1Database,
  storage: ArticleStorage,
  id: number
): Promise<Article | null> {
  const { results } = await db
    .prepare("SELECT * FROM articles WHERE id = ? AND deleted_at IS NULL")
    .bind(id)
    .all();

  if (results.length === 0) return null;

  const article = results[0] as unknown as Article;

  // Load tags
  const { results: tags } = await db
    .prepare(
      `
      SELECT t.* FROM tags t
      INNER JOIN article_tags at ON t.id = at.tag_id
      WHERE at.article_id = ?
    `
    )
    .bind(id)
    .all();

  article.tags = tags as unknown as Tag[];

  // Load content from R2
  if (article.content_key) {
    const content = await storage.getContent(article.content_key);
    article.content = content ?? undefined;
  }

  return article;
}

/**
 * Create new article with R2 storage
 */
export async function createArticle(
  db: D1Database,
  storage: ArticleStorage,
  data: { title: string; content: string; memo?: string; tags?: string[]; category_id?: number | null }
): Promise<number> {
  const { title, content, memo, tags, category_id } = data;

  // 1. Create temporary record in D1 to get ID
  const { meta } = await db
    .prepare("INSERT INTO articles (title, memo, category_id) VALUES (?, ?, ?)")
    .bind(title, memo || null, category_id || null)
    .run();

  const articleId = meta.last_row_id!;

  // 2. Save content to R2
  const { key, size, hash } = await storage.saveContent(articleId, content);

  // 3. Update D1 record with R2 metadata
  await db
    .prepare(
      `
      UPDATE articles
      SET content_key = ?, content_size = ?, content_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    )
    .bind(key, size, hash, articleId)
    .run();

  // 4. Process tags
  if (tags && tags.length > 0) {
    await updateArticleTags(db, articleId, tags);
  }

  // 5. Sync to FTS
  await db
    .prepare('INSERT INTO articles_fts(rowid, title, memo, body) VALUES(?, ?, ?, ?)')
    .bind(articleId, title ?? '', memo ?? '', content ?? '')
    .run()
    .catch(() => {});

  return articleId;
}

/**
 * Update article with R2 storage support
 */
export async function updateArticle(
  db: D1Database,
  storage: ArticleStorage,
  id: number,
  data: { title?: string; content?: string; memo?: string; tags?: string[]; category_id?: number | null }
): Promise<Article | null> {
  const { title, content, memo, tags, category_id } = data;

  // Check if article exists
  const existing = await db
    .prepare("SELECT * FROM articles WHERE id = ? AND deleted_at IS NULL")
    .bind(id)
    .all();

  if (existing.results.length === 0) return null;

  // Update content in R2 if provided
  if (content !== undefined) {
    const { key, size, hash } = await storage.saveContent(id, content);

    await db
      .prepare(
        `
        UPDATE articles
        SET content_key = ?, content_size = ?, content_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      )
      .bind(key, size, hash, id)
      .run();
  }

  // Update metadata
  if (title !== undefined || memo !== undefined || category_id !== undefined) {
    await db
      .prepare(
        `
        UPDATE articles
        SET
          title = COALESCE(?, title),
          memo = COALESCE(?, memo),
          category_id = COALESCE(?, category_id),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      )
      .bind(title || null, memo || null, category_id ?? null, id)
      .run();
  }

  // Update tags
  if (tags !== undefined) {
    await updateArticleTags(db, id, tags);
  }

  // Sync to FTS
  const existingRow = existing.results[0] as any;
  let ftsBody = content;
  if (ftsBody === undefined && existingRow.content_key) {
    ftsBody = await storage.getContent(existingRow.content_key) ?? '';
  }
  const ftsTitle = title ?? existingRow.title ?? '';
  const ftsMemo = memo ?? existingRow.memo ?? '';
  await db.prepare('DELETE FROM articles_fts WHERE rowid = ?').bind(id).run().catch(() => {});
  await db
    .prepare('INSERT INTO articles_fts(rowid, title, memo, body) VALUES(?, ?, ?, ?)')
    .bind(id, ftsTitle, ftsMemo, ftsBody ?? '')
    .run()
    .catch(() => {});

  // Return updated article
  return await getArticleById(db, storage, id);
}

/**
 * Soft delete article (R2 content is preserved)
 */
export async function deleteArticle(
  db: D1Database,
  id: number
): Promise<boolean> {
  const { meta } = await db
    .prepare("UPDATE articles SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(id)
    .run();

  await db.prepare('DELETE FROM articles_fts WHERE rowid = ?').bind(id).run().catch(() => {});

  return meta.changes > 0;
}

/**
 * Get trashed articles (metadata only)
 */
export async function getTrashedArticles(
  db: D1Database
): Promise<ArticleMetadata[]> {
  const { results } = await db
    .prepare(
      `
      SELECT
        id, title, content_key, content_size, content_hash, memo,
        created_at, updated_at, deleted_at
      FROM articles
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `
    )
    .all();

  const articles = results as unknown as ArticleMetadata[];
  const articleIds = articles.map((a) => a.id);

  if (articleIds.length === 0) return [];

  // Batch load tags
  const placeholders = articleIds.map(() => "?").join(",");
  const { results: tagResults } = await db
    .prepare(
      `
      SELECT at.article_id, t.id, t.name, t.created_at
      FROM article_tags at
      INNER JOIN tags t ON at.tag_id = t.id
      WHERE at.article_id IN (${placeholders})
    `
    )
    .bind(...articleIds)
    .all();

  const tagMap = new Map<number, Tag[]>();
  for (const row of tagResults as any[]) {
    if (!tagMap.has(row.article_id)) {
      tagMap.set(row.article_id, []);
    }
    tagMap.get(row.article_id)!.push({
      id: row.id,
      name: row.name,
      created_at: row.created_at,
    });
  }

  for (const article of articles) {
    article.tags = tagMap.get(article.id) || [];
  }

  return articles;
}

/**
 * Restore article from trash
 */
export async function restoreArticle(
  db: D1Database,
  id: number
): Promise<boolean> {
  const { meta } = await db
    .prepare("UPDATE articles SET deleted_at = NULL WHERE id = ?")
    .bind(id)
    .run();

  return meta.changes > 0;
}

/**
 * Get all tags
 */
export async function getTags(db: D1Database): Promise<Tag[]> {
  const { results } = await db
    .prepare("SELECT * FROM tags ORDER BY name ASC")
    .all();

  return results as unknown as Tag[];
}

/**
 * Search articles by query — FTS5 full-text (title + memo + body), LIKE fallback for short queries
 */
export async function searchArticles(
  db: D1Database,
  query: string
): Promise<ArticleMetadata[]> {
  let articleIds: number[] = [];

  if (query.length >= 3) {
    try {
      const ftsQuery = `"${query.replace(/"/g, '""')}"`;
      const { results: ftsResults } = await db
        .prepare('SELECT rowid FROM articles_fts WHERE articles_fts MATCH ? ORDER BY rank')
        .bind(ftsQuery)
        .all();
      articleIds = ftsResults.map((r: any) => r.rowid as number);
    } catch (_) {
      // fall through to LIKE
    }
  }

  let articles: ArticleMetadata[];

  if (articleIds.length > 0) {
    const placeholders = articleIds.map(() => '?').join(',');
    const { results } = await db
      .prepare(
        `SELECT id, title, content_key, content_size, content_hash, memo,
                category_id, created_at, updated_at, deleted_at
         FROM articles
         WHERE id IN (${placeholders}) AND deleted_at IS NULL
         ORDER BY created_at DESC`
      )
      .bind(...articleIds)
      .all();
    articles = results as unknown as ArticleMetadata[];
  } else {
    const searchTerm = `%${query}%`;
    const { results } = await db
      .prepare(
        `SELECT id, title, content_key, content_size, content_hash, memo,
                category_id, created_at, updated_at, deleted_at
         FROM articles
         WHERE deleted_at IS NULL AND (title LIKE ? OR memo LIKE ?)
         ORDER BY created_at DESC`
      )
      .bind(searchTerm, searchTerm)
      .all();
    articles = results as unknown as ArticleMetadata[];
  }

  if (articles.length === 0) return [];

  const ids = articles.map((a) => a.id);
  const placeholders = ids.map(() => '?').join(',');
  const { results: tagResults } = await db
    .prepare(
      `SELECT at.article_id, t.id, t.name, t.created_at
       FROM article_tags at
       INNER JOIN tags t ON at.tag_id = t.id
       WHERE at.article_id IN (${placeholders})`
    )
    .bind(...ids)
    .all();

  const tagMap = new Map<number, Tag[]>();
  for (const row of tagResults as any[]) {
    if (!tagMap.has(row.article_id)) tagMap.set(row.article_id, []);
    tagMap.get(row.article_id)!.push({ id: row.id, name: row.name, created_at: row.created_at });
  }
  for (const article of articles) {
    article.tags = tagMap.get(article.id) || [];
  }

  return articles;
}

/**
 * Rebuild FTS index from R2 content — run once after migration, or to resync
 */
export async function rebuildFts(db: D1Database, storage: ArticleStorage): Promise<number> {
  const { results } = await db
    .prepare('SELECT id, title, memo, content_key FROM articles WHERE deleted_at IS NULL')
    .all();

  let synced = 0;
  await Promise.all(
    (results as any[]).map(async (row) => {
      const body = row.content_key ? (await storage.getContent(row.content_key)) ?? '' : '';
      await db.prepare('DELETE FROM articles_fts WHERE rowid = ?').bind(row.id).run().catch(() => {});
      await db
        .prepare('INSERT INTO articles_fts(rowid, title, memo, body) VALUES(?, ?, ?, ?)')
        .bind(row.id, row.title ?? '', row.memo ?? '', body)
        .run()
        .catch(() => {});
      synced++;
    })
  );

  return synced;
}

/**
 * Get all tags with article count
 */
export async function getAllTags(db: D1Database): Promise<Array<Tag & { article_count: number }>> {
  const { results } = await db
    .prepare(
      `
      SELECT
        t.id,
        t.name,
        t.created_at,
        COUNT(at.article_id) as article_count
      FROM tags t
      LEFT JOIN article_tags at ON t.id = at.tag_id
      LEFT JOIN articles a ON at.article_id = a.id AND a.deleted_at IS NULL
      GROUP BY t.id, t.name, t.created_at
      ORDER BY article_count DESC, t.name ASC
    `
    )
    .all();

  return results as unknown as Array<Tag & { article_count: number }>;
}

/**
 * Helper: Update article tags
 */
async function updateArticleTags(
  db: D1Database,
  articleId: number,
  tagNames: string[]
): Promise<void> {
  // Delete existing tag associations
  await db
    .prepare("DELETE FROM article_tags WHERE article_id = ?")
    .bind(articleId)
    .run();

  // Add new tags
  for (const tagName of tagNames) {
    let { results: existingTags } = await db
      .prepare("SELECT id FROM tags WHERE name = ?")
      .bind(tagName)
      .all();

    let tagId: number;
    if (existingTags.length > 0) {
      tagId = (existingTags[0] as unknown as { id: number }).id;
    } else {
      const tagResult = await db
        .prepare("INSERT INTO tags (name) VALUES (?)")
        .bind(tagName)
        .run();
      tagId = tagResult.meta.last_row_id!;
    }

    await db
      .prepare("INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)")
      .bind(articleId, tagId)
      .run();
  }
}

/**
 * Update tag name
 */
export async function updateTag(db: D1Database, id: number, name: string): Promise<void> {
  await db
    .prepare("UPDATE tags SET name = ? WHERE id = ?")
    .bind(name, id)
    .run();
}

/**
 * Delete tag and its associations
 */
export async function deleteTag(db: D1Database, id: number): Promise<void> {
  // Delete associations first
  await db
    .prepare("DELETE FROM article_tags WHERE tag_id = ?")
    .bind(id)
    .run();

  // Delete tag
  await db
    .prepare("DELETE FROM tags WHERE id = ?")
    .bind(id)
    .run();
}

/**
 * Bulk delete tags and their associations
 */
export async function bulkDeleteTags(db: D1Database, tagIds: number[]): Promise<void> {
  if (tagIds.length === 0) return;

  const placeholders = tagIds.map(() => '?').join(',');

  // Delete associations first
  await db
    .prepare(`DELETE FROM article_tags WHERE tag_id IN (${placeholders})`)
    .bind(...tagIds)
    .run();

  // Delete tags
  await db
    .prepare(`DELETE FROM tags WHERE id IN (${placeholders})`)
    .bind(...tagIds)
    .run();
}
