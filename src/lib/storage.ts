/**
 * R2 Storage Utility for Article Content
 *
 * Handles storage and retrieval of article markdown content in Cloudflare R2.
 */

export interface StorageConfig {
  bucket: R2Bucket;
}

export interface StorageResult {
  key: string;
  size: number;
  hash: string;
}

export class ArticleStorage {
  constructor(private config: StorageConfig) {}

  /**
   * Save article content to R2
   * @param articleId Article ID
   * @param content Markdown content
   * @returns Storage metadata (key, size, hash)
   */
  async saveContent(articleId: number, content: string): Promise<StorageResult> {
    const key = `articles/${articleId}.md`;
    const buffer = new TextEncoder().encode(content);
    const hash = await this.calculateHash(buffer);

    await this.config.bucket.put(key, buffer, {
      httpMetadata: {
        contentType: 'text/markdown; charset=utf-8',
      },
      customMetadata: {
        articleId: articleId.toString(),
        hash,
        uploadedAt: new Date().toISOString(),
      },
    });

    return {
      key,
      size: buffer.byteLength,
      hash,
    };
  }

  /**
   * Get article content from R2
   * @param key R2 object key (e.g., "articles/123.md")
   * @returns Markdown content or null if not found
   */
  async getContent(key: string): Promise<string | null> {
    const object = await this.config.bucket.get(key);
    if (!object) return null;

    return await object.text();
  }

  /**
   * Delete article content from R2
   * @param key R2 object key
   */
  async deleteContent(key: string): Promise<void> {
    await this.config.bucket.delete(key);
  }

  /**
   * Check if content exists in R2
   * @param key R2 object key
   * @returns true if exists
   */
  async exists(key: string): Promise<boolean> {
    const object = await this.config.bucket.head(key);
    return object !== null;
  }

  /**
   * Calculate SHA-256 hash of content
   * @param data Content as Uint8Array
   * @returns Hex-encoded hash
   */
  private async calculateHash(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data as BufferSource);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify content integrity using hash
   * @param content Content string
   * @param expectedHash Expected SHA-256 hash
   * @returns true if hash matches
   */
  async verifyHash(content: string, expectedHash: string): Promise<boolean> {
    const buffer = new TextEncoder().encode(content);
    const actualHash = await this.calculateHash(buffer);
    return actualHash === expectedHash;
  }
}
