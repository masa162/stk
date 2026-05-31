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

## キーボードショートカット

input/textarea にフォーカス中は無効。

### ナビゲーション（Gシーケンス、1秒以内に2打目）

| キー | 移動先 |
|---|---|
| `G` → `H` | TOP（記事一覧） |
| `G` → `N` | 新規記事作成 |
| `G` → `S` | Search |
| `G` → `T` | Tags |
| `G` → `Q` | Quick |

### 表示切り替え（記事一覧ページのみ）

| キー | 表示モード |
|---|---|
| `M` | Gmail風 |
| `T` | Table |
| `C` | Card |
| `L` | Timeline |

### フィルター（記事一覧ページのみ）

| キー | アクション |
|---|---|
| `F` | Filter入力欄にフォーカス |

## titleプレフィックス運用

システム実装ではなく命名規則。filterの部分一致検索で絞り込むための個人ルール。

| prefix | 用途 |
|---|---|
| `spim` | スマホ写真バッチ（例: spim 260521） |
| `scrap` | webスクラップ週次メモ（例: scrap 260501） |
| `wip` | 書きかけ記事の下書き |
| `cfg` | 設定・コマンドメモ |
| `ref` | 用語登録・辞書的なもの |
