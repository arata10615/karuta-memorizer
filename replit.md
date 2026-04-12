# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### 競技かるた暗記練習 (`artifacts/karuta-practice`)

- **Type**: React + Vite + API backend
- **Preview path**: `/`
- **Purpose**: 競技かるた（百人一首）の暗記練習ウェブアプリ
- **Routes**: `/` → スタート画面、`/game` → ゲームボード、`/teiichi` → 定位置管理、`/howto` → 使い方、`/about-memorization` → 暗記時間とは、`/faq` → よくある質問、`/privacy` → プライバシーポリシー、`/contact` → お問い合わせ
- **Features**:
  - スタート画面（タイトル、スタート、デバイスログイン、Googleログイン、自動ログイン、ログアウト）
  - Google AdSense広告（左右サイドバー＋リセット3回ごとのインタースティシャル広告）
  - 100首からランダムに50枚を選出、敵25枚・自分25枚に分配
  - 敵陣は上下反転表示（相手目線）、左右に詰めて中央を開ける配置（下段10枚、中段8枚、上段7枚）
  - 自陣はタップまたは長押しドラッグで自由配置
  - 敵陣も長押しドラッグで同じフィールド内のカード移動・スワップ可能
  - 自動配置ボタン（学習データがある場合はパターンベース配置、なければフォールバック配置）
  - 「暗記開始」でタイマー計測開始（自陣+敵陣の配置データをDBに記録）
  - 「ストップ」で全札を裏向きに
  - 裏向きの状態でタップすると1枚ずつ確認できる
  - 緑枠・白背景のカードデザイン、3列縦書き表示
  - リセットボタンで新しいカードセットを再配分
  - デバイスベース自動ユーザー識別（localStorage UUID）
- **Content Pages** (AdSense申請用):
  - 共通ヘッダー（サイト名 + 「練習する」ボタン）+ 共通フッター（全ページリンク）
  - 使い方ページ（サイト説明、基本的な流れ、暗記練習、確認方法、便利機能）
  - 暗記時間とはページ（競技かるたの暗記時間の解説、重要性、このサイトでできること）
  - FAQページ（8つのQ&A形式）
  - プライバシーポリシーページ（情報取得、アクセス解析、広告、Cookie、管理方針）
  - お問い合わせページ（名前・メール・内容のフォーム、送信後完了メッセージ）
- **Key files**:
  - `src/pages/StartScreen.tsx` — スタート画面（ログイン・自動ログイン）+ フッターナビ
  - `src/data/karuta.ts` — 百人一首100首のデータ、ランダム配分、グリッド配置
  - `src/data/placementMemory.ts` — デバイスID管理、サーバーAPI連携の学習配置システム
  - `src/data/teiichiPattern.ts` — 定位置パターンのlocalStorage CRUD・優先順計算・自動配置ロジック
  - `src/pages/TeiichiManager.tsx` — 定位置管理画面（パターン一覧・150マス盤面・札配置UI）
  - `src/pages/KarutaBoard.tsx` — メインゲームボード（ドラッグ&ドロップ対応、定位置パターン自動配置）
  - `src/pages/HowToUse.tsx` — 使い方ページ
  - `src/pages/AboutMemorization.tsx` — 暗記時間とはページ
  - `src/pages/FAQ.tsx` — よくある質問ページ
  - `src/pages/PrivacyPolicy.tsx` — プライバシーポリシーページ
  - `src/pages/Contact.tsx` — お問い合わせページ（フォーム送信 → /api/contact）
  - `src/components/PageLayout.tsx` — コンテンツページ共通レイアウト
  - `src/components/SiteFooter.tsx` — 共通フッターナビゲーション
  - `src/index.css` — テーマとスタイル（畳風背景、緑枠カード、コンテンツページ）

### API Server (`artifacts/api-server`)

- **Preview path**: `/api`
- **Purpose**: ユーザー管理・配置データの記録・学習モデル提供
- **Database**: PostgreSQL (users, placements テーブル)
- **Endpoints**:
  - `POST /api/users/device` — デバイスIDでユーザー作成/取得
  - `POST /api/placements` — 配置データを記録（selfGrid + opGrid + userId）
  - `GET /api/placements/model?field=self|opponent&userId=X` — 配置頻度モデル+隣接ペアデータ取得
  - `GET /api/ads/config` — AdSense設定（pubId, slot IDs）を返す
  - `POST /api/contact` — お問い合わせフォーム送信（name, email, message → サーバーログに記録）
  - `GET /api/healthz` — ヘルスチェック
- **Schema**:
  - `lib/db/src/schema/users.ts` — id (uuid), device_id (unique), google_id (nullable), display_name, created_at
  - `lib/db/src/schema/placements.ts` — id, user_id (FK→users), field ('self'|'opponent'), card_id, row, col, session_id, created_at

## Smart Auto-Placement System

- **自陣**: 個人の配置履歴（userId + field=self）から学習。位置頻度 + 隣接ペア頻度でスコアリング
- **敵陣**: 全ユーザーの配置履歴（field=self、userId指定なし）から学習。将来的にfield=opponentも活用予定
- **フォールバック**: データなしの場合は左右端から詰める基本配置
- **将来計画**: Google OAuth連携でクロスデバイス永続化

## 定位置パターンシステム

- **データ保存**: localStorage (`karuta_teiichi_patterns`)
- **盤面**: 3行×50列（150マス）、25マスごとに左右ブロック区切り
- **優先順**: 左ブロックは左端（外側）→右方向、右ブロックは右端（外側）→左方向
- **パターン管理**: 最大10個まで保存、名前編集・削除・適用中切替
- **自動配置連携**: ゲームの自動配置ボタンで適用中パターンに基づき自陣25枚を優先順配置
- **フォールバック**: パターン未設定時は既存の学習ベース自動配置を使用
