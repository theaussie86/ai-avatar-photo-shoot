# Codebase Structure

**Analysis Date:** 2026-01-24

## Directory Layout

```
ai-avatar-photo-shoot/
├── app/                         # Next.js App Router pages and routes
│   ├── actions/                 # Server actions (form submissions, backend logic)
│   ├── auth/                    # Authentication routes
│   ├── collections/             # Collection management pages
│   ├── login/                   # Login page
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page (image generator)
│   └── globals.css              # Global Tailwind styles
├── components/                  # React components
│   ├── avatar-creator/          # Image generation UI components
│   ├── collections/             # Collection display components
│   ├── layout/                  # Header, navigation components
│   ├── providers/               # React providers (QueryProvider, theme)
│   └── ui/                      # Shadcn UI primitives (Button, Dialog, etc)
├── lib/                         # Business logic, utilities, services
│   ├── supabase/                # Supabase client initialization
│   ├── image-generation.ts      # Image generation logic (validation, prompt refinement, generation)
│   ├── image-persistence.ts     # IndexedDB utilities for client-side temporary storage
│   ├── storage.ts               # Supabase storage bucket operations
│   ├── encryption.ts            # AES-256-GCM encryption for API keys
│   ├── prompts.ts               # Gemini system prompts
│   ├── poses.ts                 # Pose descriptions for shot types
│   ├── schemas.ts               # Zod validation schemas
│   └── utils.ts                 # General utilities (cn for className merging)
├── hooks/                       # Custom React hooks
│   └── use-download-image.ts    # Hook for downloading images
├── types/                       # TypeScript type definitions
│   └── database.types.ts        # Supabase-generated database types
├── public/                      # Static assets (logo, manifest)
│   ├── logo.png
│   └── manifest.json
├── scripts/                     # Utility scripts
│   ├── gemini/                  # Gemini API testing and debugging
│   ├── cleanup-storage.ts       # Storage cleanup utilities
│   └── release.js               # Version release automation
├── supabase/                    # Supabase configuration
│   └── migrations/              # Database migrations
├── docs/                        # Documentation
├── .github/                     # GitHub workflows
├── .vscode/                     # VS Code settings
└── .planning/                   # GSD planning documents
    └── codebase/                # Architecture and codebase analysis
```

## Directory Purposes

**app/:**
- Purpose: Application routes and pages following Next.js App Router convention
- Contains: Page components (server components by default), route handlers, layouts
- Key files: `layout.tsx` (root), `page.tsx` (home), `login/page.tsx`, `collections/page.tsx`

**app/actions/:**
- Purpose: Server actions for mutations and backend operations
- Contains: "use server" functions that handle authentication, database writes, image generation
- Key files: `image-actions.ts` (primary generation logic), `profile-actions.ts` (user settings)

**app/auth/:**
- Purpose: Authentication flows and callbacks
- Contains: OAuth callback handler and error pages
- Key files: `auth/callback/route.ts` (exchanges auth code for session)

**app/collections/:**
- Purpose: Collection management UI routes
- Contains: Collections list page and individual collection detail pages
- Key files: `collections/page.tsx`, `collections/[id]/page.tsx`

**components/:**
- Purpose: Reusable React components
- Contains: UI components, feature components, layout templates
- Key files: `ConfigurationPanel.tsx` (main form), `ImageGallery.tsx` (results display), `SettingsModal.tsx` (user API key)

**components/avatar-creator/:**
- Purpose: Components specific to avatar/image generation interface
- Contains: Configuration form, image gallery, settings modal, image cards
- Key files: `ConfigurationPanel.tsx`, `ImageGallery.tsx`, `SettingsModal.tsx`

**components/ui/:**
- Purpose: Reusable UI primitives from Shadcn/Radix UI
- Contains: Button, Dialog, Input, Select, Slider, Switch, etc (styled with Tailwind)
- Usage: Imported by feature components for consistent styling

**lib/:**
- Purpose: Business logic, utilities, and service abstractions
- Contains: Image generation pipeline, storage operations, encryption, validation
- Key files: `image-generation.ts`, `storage.ts`, `encryption.ts`, `schemas.ts`

**lib/supabase/:**
- Purpose: Supabase client initialization for server and browser contexts
- Contains: Server-side SSR client and client-side browser client factories
- Key files: `server.ts` (server component client), `client.ts` (browser client)

**hooks/:**
- Purpose: Custom React hooks for client-side logic
- Contains: Query hooks, mutation hooks, utility hooks
- Key files: `use-download-image.ts` (download image from URL)

**types/:**
- Purpose: TypeScript type definitions
- Contains: Supabase-generated database types, custom type extensions
- Key files: `database.types.ts` (auto-generated from Supabase schema)

**public/:**
- Purpose: Static assets served at root URL
- Contains: Logo, manifest, favicon references
- Key files: `logo.png`, `manifest.json`

**scripts/:**
- Purpose: Build-time and development utility scripts
- Contains: Gemini API debugging, storage cleanup, version management
- Key files: `release.js` (npm version automation), `gemini/test-files-api.ts` (API testing)

**supabase/:**
- Purpose: Supabase project configuration and database schema
- Contains: SQL migrations that define tables and policies
- Key files: `migrations/` directory contains timestamped .sql files for schema changes

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout, wraps entire app with providers (QueryProvider, Toaster)
- `app/page.tsx`: Home page, main image generation interface
- `next.config.ts`: Next.js configuration (image remotePatterns, server action limits)

**Configuration:**
- `tsconfig.json`: TypeScript compiler options, path aliases (@/* = ./*), strict mode enabled
- `package.json`: Dependencies and scripts (dev, build, test, release)
- `.env.local`: Environment variables (Supabase URL/key, Gemini API key template, encryption secret)
- `components.json`: Shadcn UI configuration for component generation

**Core Logic:**
- `lib/image-generation.ts`: Validation, prompt refinement, image generation (Gemini API)
- `lib/storage.ts`: Upload/download/delete operations on Supabase storage buckets
- `lib/encryption.ts`: AES-256-GCM encryption/decryption for API keys
- `lib/schemas.ts`: Zod schemas for config validation (ImageGenerationSchema, ApiKeySchema)
- `app/actions/image-actions.ts`: Main server action orchestrating entire generation pipeline

**Database/Auth:**
- `lib/supabase/server.ts`: Server-side Supabase client with cookie-based session management
- `lib/supabase/client.ts`: Browser-side Supabase client for client components
- `app/auth/callback/route.ts`: OAuth callback handler

**UI Components:**
- `components/avatar-creator/ConfigurationPanel.tsx`: Main form for generation settings
- `components/avatar-creator/ImageGallery.tsx`: Gallery display with polling for generation status
- `components/avatar-creator/ImageCard.tsx`: Individual image card with download/delete
- `components/avatar-creator/SettingsModal.tsx`: User settings (Gemini API key input)
- `components/layout/Header.tsx`: Navigation header with user profile

**Testing:**
- `app/actions/image-actions.test.ts`: Tests for server action logic
- `app/actions/profile-actions.test.ts`: Tests for profile mutations
- `lib/image-generation.test.ts`: Tests for generation utility functions
- `lib/storage.test.ts`: Tests for storage operations
- `lib/encryption.test.ts`: Tests for encryption/decryption
- `vitest.config.ts`: Vitest configuration with jsdom environment

## Naming Conventions

**Files:**
- Page components: `page.tsx` in route directories (e.g., `app/page.tsx`, `app/collections/page.tsx`)
- Route handlers: `route.ts` for API routes (e.g., `app/auth/callback/route.ts`)
- Server actions: Named exports in `app/actions/*.ts` files with `Action` suffix (e.g., `generateImagesAction`)
- Components: PascalCase with `.tsx` extension (e.g., `ConfigurationPanel.tsx`)
- Utilities/hooks: camelCase with `.ts` extension (e.g., `use-download-image.ts`, `image-generation.ts`)
- Tests: `*.test.ts` or `*.test.tsx` suffix next to source file
- Styles: Global CSS in `app/globals.css`, Tailwind utility classes in components

**Directories:**
- Feature directories: lowercase with hyphens (e.g., `avatar-creator`, `image-gallery`)
- Route segments: lowercase or bracketed for dynamic routes (e.g., `[id]` for route parameters)
- Utility directories: lowercase plural when multiple files (e.g., `components`, `hooks`)

**Variables & Functions:**
- Constants: UPPER_SNAKE_CASE for schema constants (e.g., `ASPECT_RATIOS`, `SHOT_TYPES`, `POSES`)
- Functions: camelCase for regular functions and hooks (e.g., `refinePrompt`, `generateImage`, `useDownloadImage`)
- React Components: PascalCase (e.g., `ConfigurationPanel`, `ImageGallery`)
- Props interfaces: PascalCase + `Props` suffix (e.g., `ConfigurationPanelProps`, `ImageCardProps`)

**Types:**
- Zod schemas: PascalCase `*Schema` suffix (e.g., `ImageGenerationSchema`, `ApiKeySchema`)
- Inferred types from schemas: PascalCase (e.g., `ImageGenerationConfig`, `ApiKeyConfig`)
- Database types: Auto-generated from Supabase, mixed casing (e.g., `Database`, `Tables`, `PublicSchema`)

## Where to Add New Code

**New Feature (Complete Flow):**
- Page component: `app/[feature]/page.tsx` for server component with data fetching
- Server action: `app/actions/[feature]-actions.ts` with "use server" functions
- UI components: `components/[feature]/` directory with feature-specific components
- Tests: `app/actions/[feature]-actions.test.ts` and component files with `.test.tsx`
- Schema validation: Add Zod schema to `lib/schemas.ts` if needed for form validation

**New Component/Module:**
- Feature component: `components/[feature-name]/ComponentName.tsx` with "use client" if interactive
- Presentational component: `components/ui/` for reusable primitives (already using Shadcn presets)
- Utility functions: `lib/[functionality].ts` for pure functions and service abstractions

**New Server Action:**
- Location: `app/actions/[domain]-actions.ts` (e.g., `image-actions.ts`, `profile-actions.ts`)
- Pattern: Export named async functions with "use server" directive at top
- Validation: Use Zod schema `.safeParse()` or `.parse()` at entry point
- Authentication: Call `supabase.auth.getUser()` and redirect if unauthenticated
- Error handling: Throw errors with descriptive messages for client toast display

**Utilities/Helpers:**
- Shared utilities: `lib/utils.ts` for general-purpose helpers (already contains `cn` for className merging)
- Domain-specific utilities: `lib/[domain].ts` for cohesive functionality (e.g., `storage.ts`, `encryption.ts`)
- Type definitions: `lib/schemas.ts` for all Zod schemas and inferred types

**Tests:**
- Unit tests: Co-located with source files (e.g., `lib/image-generation.test.ts`)
- Integration tests: In `app/actions/[name].test.ts` for server actions
- Config: Vitest via `vitest.config.ts` with jsdom for React component testing

## Special Directories

**node_modules/:**
- Purpose: Installed dependencies from npm
- Generated: Yes (created by npm install)
- Committed: No (excluded via .gitignore)

**.next/:**
- Purpose: Next.js build output and generated types
- Generated: Yes (created by `npm run build`)
- Committed: No (excluded via .gitignore)

**.planning/:**
- Purpose: GSD orchestration and codebase analysis documents
- Generated: Yes (created by gsd-mapping agent)
- Committed: Yes (for team collaboration)

**supabase/.branches/ and supabase/.temp/:**
- Purpose: Local Supabase CLI temporary/branch data
- Generated: Yes (created by Supabase CLI)
- Committed: No (excluded via .gitignore)

**scripts/gemini/output/:**
- Purpose: Output from Gemini debugging and testing scripts
- Generated: Yes (created during script execution)
- Committed: No (temporary development artifacts)

---

*Structure analysis: 2026-01-24*
