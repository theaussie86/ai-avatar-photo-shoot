# CLAUDE.md

## Project

Next.js 16 app for AI avatar generation via Google Gemini. BYOK model - users provide Gemini API keys.

**Stack:** Next.js (App Router), React 19, TypeScript (strict), Tailwind 4, Supabase, Gemini API

## Commands

```bash
npm run dev          # port 3001
npm run build|lint|test
npm run types:update # regen Supabase types
npm run db:push|pull
```

## Structure

- `app/actions/` - Server Actions (image generation, profiles)
- `lib/` - Core logic: image-generation.ts, encryption.ts, storage.ts, poses.ts, schemas.ts
- `components/` - UI: avatar-creator/, collections/, layout/, ui/
- `lib/supabase/` - Client init (server.ts, client.ts)

**DB:** profiles, collections, images (RLS)
**Storage:** `uploaded_images`, `generated_images`

## Conventions

- Imports: `@/` alias, absolute paths only
- Server Actions: `"use server"`, `*Action` suffix
- Client Components: explicit `"use client"`
- Naming: files=kebab-case, components=PascalCase, functions=camelCase, constants=UPPER_SNAKE
- Types: PascalCase, infer from Zod (`z.infer<typeof Schema>`)
- Named exports only, no barrels

## Testing

Vitest + jsdom. Tests co-located (`.test.ts`).

```ts
vi.mock('@/lib/supabase/server', ...)
vi.mock('@google/genai', ...)
vi.stubEnv('ENCRYPTION_SECRET', value)
vi.clearAllMocks() // in beforeEach
```

## Env

`.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ENCRYPTION_SECRET`, `SECRET_KEY`
