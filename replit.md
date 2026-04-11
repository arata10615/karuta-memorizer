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

- **Type**: React + Vite (frontend only, no backend)
- **Preview path**: `/`
- **Purpose**: 競技かるた（百人一首）の暗記練習ウェブアプリ
- **Features**:
  - 自陣25枚（奇数番号）を定位置に自動配置
  - 相手陣25枚（偶数番号）をランダム配置
  - 「暗記開始」でタイマー計測開始
  - 「ストップ」で全札を裏向きに
  - 裏向きの状態でタップすると1枚ずつ確認できる（再タップで裏に戻る）
  - 縦書きで下の句（取り札）を表示
- **Key files**:
  - `src/data/karuta.ts` — 百人一首100首のデータと配置情報
  - `src/pages/KarutaBoard.tsx` — メインゲームボード
  - `src/index.css` — テーマとスタイル（和紙風）
