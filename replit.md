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
- **Features**:
  - 100首からランダムに50枚を選出、敵25枚・自分25枚に分配
  - 敵陣は左右に詰めて中央を開ける配置（下段10枚、中段8枚、上段7枚）
  - 自陣はタップまたは長押しドラッグで自由配置
  - 敵陣も長押しドラッグでカード移動可能
  - 自動配置ボタン（全ユーザーの配置履歴から学習した配置パターンを使用）
  - 「暗記開始」でタイマー計測開始（配置データをDBに記録）
  - 「ストップ」で全札を裏向きに
  - 裏向きの状態でタップすると1枚ずつ確認できる
  - 緑枠・白背景のカードデザイン、3列縦書き表示
  - リセットボタンで新しいカードセットを再配分
- **Key files**:
  - `src/data/karuta.ts` — 百人一首100首のデータ、ランダム配分、グリッド配置
  - `src/data/placementMemory.ts` — サーバーAPI連携の学習配置システム
  - `src/pages/KarutaBoard.tsx` — メインゲームボード（ドラッグ&ドロップ対応）
  - `src/index.css` — テーマとスタイル（畳風背景、緑枠カード）

### API Server (`artifacts/api-server`)

- **Preview path**: `/api`
- **Purpose**: 配置データの記録・学習モデル提供
- **Database**: PostgreSQL (placements テーブル)
- **Endpoints**:
  - `POST /api/placements` — 配置データを記録（grid配列を送信）
  - `GET /api/placements/model` — 全ユーザーの配置頻度モデルを取得
  - `GET /api/healthz` — ヘルスチェック
- **Schema**: `lib/db/src/schema/placements.ts` — card_id, row, col, created_at
