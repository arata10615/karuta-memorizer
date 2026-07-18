# Googleログイン・定位置同期の本番設定

この構成では、Cloudflare Pages はフロントエンドを配信し、APIサーバーは別途Node.jsを実行できるサービス（Render、Railway、Fly.ioなど）へ公開します。

## 1. APIサーバーを公開する

`artifacts/api-server` をNode.js対応サービスへデプロイし、次の環境変数を設定します。

```env
DATABASE_URL=Neon Postgresの接続URL
GOOGLE_CLIENT_ID=Google OAuthのWeb Client ID
AUTH_SESSION_SECRET=32文字以上のランダムな秘密文字列
WEB_ORIGIN=https://あなたのPagesドメイン
NODE_ENV=production
```

`WEB_ORIGIN` は複数許可する場合、カンマ区切りにします。

```env
WEB_ORIGIN=https://karuta.example,https://preview.example
```

公開後、APIのURLが `https://api.example.com/api/health` のように到達できることを確認します。

## 2. Cloudflare Pagesを設定する

PagesプロジェクトのProduction環境変数に以下を設定してから再デプロイします。

```env
VITE_GOOGLE_CLIENT_ID=Google OAuthのWeb Client ID
VITE_API_BASE_URL=https://api.example.com/api
```

ビルド設定:

```text
Root directory: artifacts/karuta-practice
Build command: pnpm run build
Build output directory: dist
```

## 3. Google Cloud Consoleを設定する

OAuth Web Client の **Authorized JavaScript origins** にフロントの公開URLを追加します。

```text
https://あなたのPagesドメイン
```

独自ドメインへ移行した場合も、新しいURLを追加します。

## 4. DBスキーマを反映する

`DATABASE_URL` を設定した状態で、リポジトリのルートから実行します。

```bash
pnpm --filter @workspace/db push
```

## 5. 動作確認

1. 本番画面でGoogleログインする。
2. 定位置画面でパターンを作成・配置して保存する。
3. 画面を再読み込みする。
4. 同じGoogleアカウントの定位置が復元されることを確認する。

定位置APIは、Googleログイン時に発行されたセッショントークンからユーザーを判定します。クライアントから `userId` を指定して別ユーザーのデータを読み書きすることはできません。
