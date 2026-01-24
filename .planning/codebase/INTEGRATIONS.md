# External Integrations

**Analysis Date:** 2026-01-24

## APIs & External Services

**AI/Image Generation:**
- Google Gemini API - Generates avatar photos from prompts with reference images
  - SDK/Client: `@google/genai` (1.35.0)
  - Auth: `GEMINI_API_KEY` environment variable
  - Models used: `gemini-2.5-flash-image`, `gemini-2.5-flash` (in `app/actions/image-actions.ts` lines 351, 40)
  - Features: Text-to-image generation, file upload API integration, reference image support
  - Key files: `lib/image-generation.ts`, `app/actions/image-actions.ts`

**Authentication & User Management:**
- Supabase Auth - OAuth-based authentication system
  - Supports email/password and OAuth providers
  - Auth callback handler: `app/auth/callback/route.ts`
  - Server client: `lib/supabase/server.ts`
  - Browser client: `lib/supabase/client.ts`

## Data Storage

**Databases:**
- PostgreSQL (via Supabase)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Client SDKs: `@supabase/supabase-js` (2.89.0), `@supabase/ssr` (0.8.0)
  - Tables: `profiles`, `collections`, `images`
  - Row-level security (RLS) enabled on all tables
  - Migrations stored in: `supabase/migrations/`
  - Key tables:
    - `profiles` - User settings including encrypted Gemini API keys
    - `collections` - Groups of generated images
    - `images` - Individual generated/uploaded images with metadata

**File Storage:**
- Supabase Storage (S3-compatible buckets)
  - `generated_images` bucket - Stores AI-generated images
  - `uploaded_images` bucket - Stores reference images uploaded by users
  - Key file operations: `lib/storage.ts` (upload, delete, folder cleanup)
  - Image generation flow: User uploads → Supabase → Gemini → Generated image → Supabase
  - Public URL generation via signed/public storage paths

**Browser Storage:**
- IndexedDB (via `idb` package 8.0.3)
  - Purpose: Client-side caching and offline support
  - Configured in component providers

**Caching:**
- React Query (@tanstack/react-query 5.90.16)
  - Query caching and synchronization
  - Devtools enabled in development

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (custom OAuth and email/password)
  - Implementation: Session-based via cookies (Next.js middleware pattern)
  - Token management: Access tokens and refresh tokens handled by Supabase SSR
  - User context: Available via `supabase.auth.getUser()` and `supabase.auth.getSession()`
  - Password reset and email verification via Supabase
  - Key files: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `app/auth/callback/route.ts`

## Monitoring & Observability

**Error Tracking:**
- Not detected - Console logging only

**Logs:**
- Server-side: `console.log()` and `console.error()` for server actions
- Client-side: Browser console logs
- Key logging points: Image generation progress, API calls, database operations
- Example: `[Task ${imageId}]` prefix for image generation task logs (in `app/actions/image-actions.ts`)

## CI/CD & Deployment

**Hosting:**
- Vercel - Next.js deployment platform (`.vercel` directory present)

**CI Pipeline:**
- GitHub Actions - Workflow files in `.github/workflows/`:
  - `ci.yml` - Continuous integration tests
  - `release.yml` - Automated release process
  - `check-version-bump.yml` - Version bump validation on PRs
  - Scripts: `scripts/release.js` for release automation

## Environment Configuration

**Required env vars (development):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous API key (public)
- `GEMINI_API_KEY` - Google Gemini API key (secret)
- `ENCRYPTION_SECRET` - Secret for AES encryption of stored API keys (secret)
- `SECRET_KEY` - Supabase service role key (server-side only, secret)

**Secrets location:**
- `.env.local` - Local development (git-ignored)
- Vercel deployment environment variables - For production

## Data Flow

**Image Generation Workflow:**

1. User uploads reference images → Client stores in IndexedDB → Uploads to Supabase `uploaded_images` bucket
2. User configures generation settings → Validates via Zod schema
3. Server action `generateImagesAction()` executes:
   - Fetches user's encrypted Gemini API key from `profiles` table
   - Decrypts API key using `ENCRYPTION_SECRET`
   - Downloads reference images from Supabase storage
   - Uploads to Gemini Files API
   - Creates placeholder image records in `images` table with status 'pending'
   - Returns immediately to client (non-blocking)
4. Background task `generateImageTask()` executes:
   - Constructs prompt with reference images
   - Calls Gemini API for image generation
   - Waits for result (handles rate limiting and processing delays)
   - Uploads generated image to Supabase `generated_images` bucket
   - Updates image record with 'completed' status and public URL
   - Cleans up Gemini temporary files

**User Profile Setup:**

1. User authenticates via Supabase Auth
2. Auth callback triggers profile creation (via trigger in migration `20260105140000_profile_autogen_trigger.sql`)
3. User enters Gemini API key in Settings
4. App encrypts key using `ENCRYPTION_SECRET` and stores in `profiles.gemini_api_key`
5. Key is decrypted on-demand during image generation

## Webhooks & Callbacks

**Incoming:**
- None detected - System uses polling for async image generation status

**Outgoing:**
- Auth callback: `app/auth/callback/route.ts` - Handles OAuth code exchange with Supabase
- Supabase real-time subscriptions could be used but not implemented

## API Integrations Summary

| Service | Purpose | Auth Type | Status |
|---------|---------|-----------|--------|
| Supabase Auth | User authentication | OAuth/Email | Required |
| Supabase Database | Data persistence | Session-based RLS | Required |
| Supabase Storage | Image storage | Session-based RLS | Required |
| Google Gemini | Image generation | API Key | Required |
| Vercel | Hosting | N/A | Production |
| GitHub Actions | CI/CD | OAuth (GitHub) | Development |

---

*Integration audit: 2026-01-24*
