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
- **AI**: OpenAI via Replit AI Integrations (image generation with `gpt-image-1`)

## Artifacts

### StickerAI (`artifacts/sticker-gen`)
- React + Vite web app at path `/`
- Users describe a sticker idea, AI generates a cute image, and the sticker is saved to the gallery
- Uses pastel color palette (soft pinks, mints, lavenders)
- Animated headline cycling through example ideas
- Suggestion chips for quick prompt ideas
- Sticker gallery with delete functionality

### API Server (`artifacts/api-server`)
- Express 5 backend at path `/api`
- Routes: `/api/stickers` (CRUD), `/api/openai/generate-image`
- DB: `stickers` table with prompt and base64 image data

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

- `stickers` — id, prompt, image_data (base64), created_at

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
