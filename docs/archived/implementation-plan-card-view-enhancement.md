# 実装計画：カードビューの画像とテキスト抜粋対応

## 概要
`/api/articles` のレスポンスに `thumbnail_url`（画像URL）と `excerpt`（テキスト抜粋）を追加し、カードビューで表示できるようにします。

---

## アプローチ: バックエンド拡張方式

**メリット:**
- パフォーマンス最適化（記事一覧取得時に一度だけ処理）
- フロントエンド実装がシンプル
- 将来的に他のビューでも活用可能

---

## 実装手順

### Step 1: 型定義の拡張

**ファイル:** `src/lib/db/types.ts`

`ArticleMetadata` インターフェースに以下を追加:
```typescript
thumbnail_url: string | null;  // 最初の画像URL
excerpt: string | null;         // 本文の冒頭テキスト（100文字程度）
```

---

### Step 2: Markdown処理ユーティリティの拡張

**ファイル:** `src/lib/markdown-utils.ts`（既存）

以下の関数を追加:
```typescript
// テキスト抜粋を取得（画像タグやMarkdown記法を除去）
extractExcerpt(markdown: string, maxLength: number): string
```

**実装内容:**
1. Markdown記法を除去（#, **, [], など）
2. 画像タグを除去（`![](URL)`）
3. 空白・改行を正規化
4. 指定文字数で切り詰め

---

### Step 3: D1データベース関数の拡張

**ファイル:** `src/lib/db/d1.ts`

`getArticles()` 関数を修正:

1. 既存の記事メタデータを取得
2. R2から各記事のcontentを並列取得（Promise.all）
3. `extractFirstImageUrl()` で画像URLを抽出
4. `extractExcerpt()` でテキスト抜粋を取得
5. ArticleMetadataに `thumbnail_url` と `excerpt` を追加

**注意点:**
- パフォーマンス考慮: 並列処理（Promise.all）で複数記事のcontentを効率的に取得
- エラーハンドリング: R2取得失敗時もリスト表示を継続（部分的な失敗を許容）
- contentがnullの記事も考慮

---

### Step 4: API レスポンスの確認

**ファイル:** `functions/_middleware.ts`

型定義の変更により自動的に対応されるため、変更不要。

---

### Step 5: フロントエンド（カードビュー）の更新

**ファイル:** `src/components/ArticleCardView.tsx`

以下の対応:
1. `article.thumbnail_url` があれば画像を表示
2. 画像がなければ `article.excerpt` をカード上に表示
3. どちらもなければ📄絵文字表示

**UI設計:**
```
┌─────────────────────┐
│   [サムネイル画像]    │  ← thumbnail_url がある場合
│                     │
├─────────────────────┤
│ タイトル              │
│ excerpt（抜粋）       │  ← 画像がない場合はexcerptを大きく表示
│ [カテゴリ][タグ]      │
│ 更新日               │
└─────────────────────┘
```

---

## 技術的考慮事項

### パフォーマンス対策
- **バッチ処理**: R2から複数記事のcontentを並列取得（Promise.all）
- **制限**: 一覧取得は最大100件程度に制限（既存の並び順を維持）
- **キャッシュ**: 将来的にCloudflare KVでキャッシュ可能

### エラーハンドリング
- R2からのcontent取得失敗時: `thumbnail_url` と `excerpt` を null に設定
- リスト表示自体は継続（部分的な失敗を許容）
- コンソールにエラーログを出力

### 既存データの互換性
- 既存の `ArticleMetadata` を使用しているコードは影響なし（新フィールドはオプショナル）
- フロントエンドは段階的に対応可能

---

## 変更ファイル一覧

1. **src/lib/db/types.ts** - 型定義追加
2. **src/lib/markdown-utils.ts** - テキスト抜粋関数追加
3. **src/lib/db/d1.ts** - getArticles関数を拡張（R2からのcontent取得を追加）
4. **src/components/ArticleCardView.tsx** - カード表示ロジック更新

---

## テスト項目

### バックエンド
- [ ] 画像URLがある記事で `thumbnail_url` が正しく抽出される
- [ ] 画像がない記事で `excerpt` が正しく抽出される
- [ ] R2取得エラー時でもAPIがエラーにならない
- [ ] 既存のAPIレスポンス形式が維持される

### フロントエンド
- [ ] カードビューで画像が表示される
- [ ] 画像がない場合にテキスト抜粋が表示される
- [ ] どちらもない場合に絵文字が表示される
- [ ] Gmail風ビュー、テーブルビューが影響を受けない

---

## デプロイ手順

1. バックエンド変更をコミット
2. ローカルで動作確認（`npm run dev`）
3. Cloudflare Pagesにデプロイ
4. 本番環境で動作確認
5. 問題があればロールバック

---

## 将来的な拡張案

- Cloudflare KVでthumbnail_urlとexcerptをキャッシュ
- 記事保存時に自動的にthumbnail_urlとexcerptを抽出してDBに保存
- 複数画像がある場合のギャラリー表示
- OGP画像の自動生成

---

**作成日:** 2025-01-22
**作成者:** Claude Code
