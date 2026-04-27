# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

- **kundali** (`/`) — Vedic astrology Janam Kundali reading website. User submits birth details + life concerns; Anthropic Claude streams a comprehensive 11-part reading via SSE.
- **api-server** (`/api`) — Shared Express 5 backend.
- **mockup-sandbox** — Local design canvas (not deployable).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 18 + Vite + Tailwind CSS v4 + framer-motion + react-hook-form + zod
- **API framework**: Express 5
- **AI**: Anthropic Claude (claude-sonnet-4-6) via Replit AI Integrations (no user API key needed)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Notes

- `lib/api-zod` re-exports generated Zod schemas under the `schemas` namespace (e.g. `import { schemas } from "@workspace/api-zod"; schemas.GenerateKundaliBody.parse(...)`) to avoid name collisions with the TypeScript types of the same name.
- The kundali generation endpoint (`POST /api/kundali/generate`) returns a `text/event-stream` and is consumed via raw `fetch` on the client — no React Query hook.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
