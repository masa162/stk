import { Article, ArticleMetadata, Tag } from "./types";
import { ArticleStorage } from "../storage";

export interface Env {
  DB: D1Database;
  ARTICLES_BUCKET: R2Bucket;
}

/**
 * Get all articles (metadata only, no content)
 * Optimized: No N+1 queries, excludes content field
 */
export async function getArticles(db: D1Database): Promise<ArticleMetadata[]> {
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

  // Map tags to articles
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

  // Attach tags to articles
  for (const article of articles) {
    article.tags = tagMap.get(article.id) || [];
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

  // Note: R2 content is NOT deleted to allow restoration
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
 * Search articles by query (metadata only)
 */
export async function searchArticles(
  db: D1Database,
  query: string
): Promise<ArticleMetadata[]> {
  const searchTerm = `%${query}%`;

  const { results } = await db
    .prepare(
      `
      SELECT
        id, title, content_key, content_size, content_hash, memo,
        created_at, updated_at, deleted_at
      FROM articles
      WHERE deleted_at IS NULL
        AND (title LIKE ? OR memo LIKE ?)
      ORDER BY created_at DESC
    `
    )
    .bind(searchTerm, searchTerm)
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
