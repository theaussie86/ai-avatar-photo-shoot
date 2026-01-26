# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Avatar Photo Shoot is a Next.js web app for creating AI-generated avatars using Google Gemini. Users upload reference photos and configure generation settings (shot type, style, background) to produce professional avatar images. The app uses a BYOK (Bring Your Own Key) model where users provide their own Gemini API keys.

## Commands

```bash
# Development
npm run dev              # Start dev server on port 3001
npm run build            # Production build
npm run lint             # ESLint check

# Testing
npm run test             # Run all tests (vitest)
npx vitest run lib/encryption.test.ts  # Run single test file

# Database
npm run types:update     # Regenerate TypeScript types from Supabase schema
npm run db:push          # Push migrations to Supabase
npm run db:pull          # Pull remote schema changes

# Release
npm version patch|minor|major  # Update version (creates commit + tag)
git push --follow-tags         # Push release
```

## Architecture

**Stack:** Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, Supabase (auth + DB + storage), Google Gemini API

**Key Layers:**
- `app/actions/` - Server Actions for image generation and profile management
- `lib/` - Business logic (image-generation.ts, encryption.ts, storage.ts, poses.ts, prompts.ts)
- `components/` - UI components (avatar-creator/, collections/, layout/, ui/)
- `lib/supabase/` - Supabase client initialization (server.ts, client.ts)

**Data Flow for Image Generation:**
1. User configures settings in `ConfigurationPanel` → validated with Zod schema
2. `generateImagesAction` authenticates user, decrypts stored Gemini API key
3. Reference images transferred from Supabase storage to Gemini Files API
4. Prompt refinement + image generation run in parallel for each requested image
5. Generated images uploaded to Supabase storage, records updated in DB
6. Client polls via React Query for status updates

**Database Tables:** profiles, collections, images (with RLS policies)

**Storage Buckets:** `uploaded_images` (user reference photos), `generated_images` (AI outputs)

## Code Conventions

- **Imports:** Use `@/` path alias (e.g., `@/lib/`, `@/components/`), absolute paths only
- **Server Actions:** Mark with `"use server"`, name functions with `Action` suffix
- **Client Components:** Explicitly mark with `"use client"`
- **Naming:** Files use kebab-case, components use PascalCase, functions use camelCase
- **Constants:** UPPER_SNAKE_CASE (e.g., `POSES`, `ASPECT_RATIOS`)
- **Types:** PascalCase, inferred from Zod schemas with `z.infer<typeof Schema>`
- **Exports:** Named exports only, no barrel files

## Testing

Tests are co-located with source files (`.test.ts` suffix). Uses Vitest with jsdom environment.

**Mocking patterns:**
- Mock Supabase client: `vi.mock('@/lib/supabase/server', ...)`
- Mock Gemini: `vi.mock('@google/genai', ...)`
- Stub env vars: `vi.stubEnv('ENCRYPTION_SECRET', value)`
- Clear mocks in `beforeEach`: `vi.clearAllMocks()`

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `ENCRYPTION_SECRET` - AES-256 key for encrypting stored API keys
- `SECRET_KEY` - Supabase service role key (server-side)

## Key Files

- `app/actions/image-actions.ts` - Core generation orchestration (~600 lines)
- `lib/image-generation.ts` - Gemini API interactions, prompt refinement
- `lib/poses.ts` - Pose descriptions by shot type (full_body, upper_body, face)
- `lib/encryption.ts` - AES-256-GCM encryption for API keys at rest
- `lib/schemas.ts` - Zod schemas for config validation
- `types/database.types.ts` - Auto-generated Supabase types
