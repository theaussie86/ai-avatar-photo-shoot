# Technology Stack

**Analysis Date:** 2026-01-24

## Languages

**Primary:**
- TypeScript 5 - All application code, server actions, and API routes
- JavaScript (Node.js) - Build scripts and configuration files

**Secondary:**
- SQL - Database migrations and Supabase schema definitions
- CSS - Styling via Tailwind CSS 4

## Runtime

**Environment:**
- Node.js (LTS) - Specified in package.json lockfile
- Browser (React 19 environment)

**Package Manager:**
- npm - with package-lock.json present
- Supabase CLI - For local database development and migrations

## Frameworks

**Core:**
- Next.js 16.1.1 - Full-stack React framework with server actions and app router
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM rendering

**UI & Forms:**
- Radix UI (@radix-ui/*) - Accessible component primitives
  - Alert Dialog, Dialog, Label, Select, Slider, Slot, Switch
- shadcn/ui 3.6.2 - Pre-built component library with Radix UI base
- Lucide React 0.562.0 - Icon library
- Tailwind CSS 4 - Utility-first CSS framework
- Tailwind Merge 3.4.0 - Merge Tailwind classes intelligently
- Embla Carousel React 8.6.0 - Carousel/slider component

**Forms & Validation:**
- React Hook Form 7.71.0 - Performant form state management
- @hookform/resolvers 5.2.2 - Schema validation resolver integration
- Zod 4.3.5 - TypeScript-first schema validation
- Class Variance Authority 0.7.1 - CSS class variant system

**State & Data:**
- @tanstack/react-query 5.90.16 - Data fetching and caching
- @tanstack/react-query-devtools 5.91.2 - React Query debugging

**Theming:**
- next-themes 0.4.6 - Dark/light mode support

**Notifications:**
- Sonner 2.0.7 - Toast notification library

**Storage:**
- idb 8.0.3 - IndexedDB wrapper for browser storage

**Utilities:**
- uuid 13.0.0 - UUID generation
- @types/uuid 10.0.0 - TypeScript types for UUID
- date-fns 4.1.0 - Date manipulation library
- jszip 3.10.1 - ZIP file creation/extraction
- clsx 2.1.1 - Conditional className utility
- dotenv 16.4.7 - Environment variable loading

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.89.0 - Primary database and auth client
- @supabase/ssr 0.8.0 - Server-side rendering support for Supabase
- @google/genai 1.35.0 - Google Gemini AI SDK for image generation

**Infrastructure:**
- Next.js framework handles routing, server components, server actions
- Supabase handles authentication, database, real-time subscriptions, storage

## Configuration

**Environment:**
- `.env.local` - Local development environment variables (not committed)
- Required vars:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
  - `GEMINI_API_KEY` - Google Gemini API key
  - `ENCRYPTION_SECRET` - Secret for encrypting stored API keys
  - `SECRET_KEY` - Supabase service role key (server-side only)

**Build:**
- `tsconfig.json` - TypeScript configuration with `@/*` path alias pointing to project root
- `next.config.ts` - Next.js configuration:
  - Server action body size limit: 20MB
  - Image optimization enabled for `**.supabase.co` hostnames
  - Environment variable injection: `NEXT_PUBLIC_APP_VERSION` from package.json
- `vitest.config.ts` - Vitest test runner configuration
  - jsdom environment for React component testing
  - Path alias: `@/*` -> project root
- `eslint.config.mjs` - ESLint configuration using Next.js core-web-vitals and TypeScript presets
- `postcss.config.mjs` - PostCSS configuration with Tailwind CSS plugin
- `components.json` - shadcn/ui configuration:
  - Style: new-york
  - Icon library: lucide
  - Tailwind CSS integration with CSS variables
  - Path aliases for components, utils, ui, lib, hooks

## Platform Requirements

**Development:**
- Node.js (latest LTS recommended)
- npm 10+
- Supabase CLI for local database management
- TypeScript knowledge required

**Production:**
- Deployment target: Vercel (detected via `.vercel` directory)
- Node.js runtime compatible with Next.js 16.1.1
- Environment variables required (Supabase credentials, Gemini API key, encryption secret)
- 20MB server action body size limit applies

---

*Stack analysis: 2026-01-24*
