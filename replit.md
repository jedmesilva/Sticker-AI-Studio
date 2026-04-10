# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL (Supabase) + Drizzle ORM
- **Auth**: Clerk (email provider active, Google configured but not yet enabled)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (image generation with `gpt-image-1`)

## Artifacts

### StickerAI (`artifacts/sticker-gen`)
- React + Vite web app at path `/`
- Users sign up/log in with email (Clerk auth)
- Users describe a sticker idea, AI generates a cute image, saved to their personal gallery
- Uses pastel color palette (soft pinks, mints, lavenders)
- Animated headline cycling through example ideas
- Suggestion chips for quick prompt ideas
- Sticker gallery with delete functionality
- Header with user avatar + sign-out button
- Vite proxy: `/api` → `http://localhost:8080`

### API Server (`artifacts/api-server`)
- Express 5 backend at path `/api`
- Routes: `/api/stickers` (CRUD, auth-protected), `/api/openai/generate-image`
- Clerk middleware: all sticker routes require authentication via `getAuth(req)`
- Clerk proxy middleware mounted at `/api/__clerk` (no-op in dev, active in prod)
- DB: `stickers` table with prompt, base64 image data, and user_id

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

- `stickers` — id, user_id (text, Clerk user ID), prompt, image_data (base64), created_at

## Auth Notes

- To enable Google login or manage users, use the **Auth pane** in the workspace toolbar
- Google OAuth credentials are not yet configured — enable via the Auth pane when ready
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` are auto-provisioned

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
