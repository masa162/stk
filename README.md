# STK - Article Management System

Hono + Cloudflare Pages + React で構築された記事管理システム

## 技術スタック

- **Backend**: Hono
- **Frontend**: React + Vite
- **Database**: Cloudflare D1
- **Storage**: Cloudflare R2
- **Deploy**: Cloudflare Pages

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# デプロイ
npm run deploy
```

## 環境変数

Cloudflare Pages Dashboardで以下を設定：

- `BASIC_AUTH_USER`: Basic認証ユーザー名
- `BASIC_AUTH_PASSWORD`: Basic認証パスワード

## バインディング

Cloudflare Pages Dashboardで以下のバインディングを設定：

- D1 Database: `DB` → `stuck-db`
- R2 Bucket: `ARTICLES_BUCKET` → `stuck-articles`

## API エンドポイント

- `GET /api/articles` - 記事一覧
- `GET /api/articles/:id` - 記事詳細
- `POST /api/articles` - 記事作成
- `PUT /api/articles/:id` - 記事更新
- `DELETE /api/articles/:id` - 記事削除（ゴミ箱へ）
- `GET /api/trash` - ゴミ箱一覧
- `POST /api/trash/:id` - 記事復元
- `GET /api/tags` - タグ一覧
- `GET /api/search?q=keyword` - 記事検索
- `GET /api/categories` - カテゴリ一覧
- その他
