# Architecture

**Analysis Date:** 2026-01-24

## Pattern Overview

**Overall:** Next.js App Router with Server Components and Server Actions

**Key Characteristics:**
- React 19 + TypeScript with strict mode enabled
- Server-first architecture using Next.js App Router for streaming and SSR
- Server Actions (`"use server"`) for backend operations and form submissions
- Client components for interactive UI (form inputs, image uploads, galleries)
- Supabase for authentication, database, and file storage
- Gemini AI API for image generation
- React Query for client-side state management and async operations
- Zod for runtime validation of configuration and forms

## Layers

**Presentation Layer (UI Components):**
- Purpose: Render interactive user interfaces for avatar creation, collections, and settings
- Location: `components/` (avatar-creator, collections, layout, ui, providers)
- Contains: React components using Radix UI primitives, custom forms with React Hook Form
- Depends on: lib (utilities, schemas, hooks), services (API calls via server actions)
- Used by: App routes (page.tsx files)

**Server Action Layer:**
- Purpose: Handle form submissions, image generation orchestration, database mutations
- Location: `app/actions/` (image-actions.ts, profile-actions.ts)
- Contains: "use server" functions that manage authentication, API key decryption, database writes, file transfers
- Depends on: lib (schemas, encryption, storage, image generation logic), external APIs (Gemini, Supabase)
- Used by: Client components and page routes

**Business Logic Layer:**
- Purpose: Core generation and processing logic separated from server/client concerns
- Location: `lib/` (image-generation.ts, image-persistence.ts, storage.ts, encryption.ts, prompts.ts, poses.ts)
- Contains: Pure functions for validation, prompt refinement, image processing, storage operations, encryption
- Depends on: External APIs (Gemini SDK), Supabase SDK
- Used by: Server actions, utility modules

**Database & Storage Layer:**
- Purpose: Abstractions for Supabase database and file storage operations
- Location: `lib/supabase/` (server.ts, client.ts) and `lib/storage.ts`
- Contains: Database client initialization, storage bucket operations, file management
- Depends on: Supabase SDK, environment variables
- Used by: Server actions, server components

**Route & Navigation Layer:**
- Purpose: Define application pages and authentication callbacks
- Location: `app/` (page.tsx files, auth/callback/, login/, collections/)
- Contains: Server components that fetch data, layout wrappers, redirect logic
- Depends on: Server actions, Supabase client, components
- Used by: Next.js routing system

## Data Flow

**Image Generation Flow:**

1. User configures settings (shot type, aspect ratio, reference images, prompt) in `ConfigurationPanel` component
2. `generateImagesAction` server action receives validated config (Zod schema)
3. Server action authenticates user, retrieves encrypted Gemini API key, decrypts it
4. Reference images transferred from Supabase `uploaded_images` bucket → Gemini Files API
5. For each image count: `refinePrompt` (Gemini) → `generateImage` (Gemini) in parallel
6. Image records created in database with pending status and metadata
7. Generated base64 image data → converted to buffer → uploaded to Supabase `generated_images` bucket
8. Database record updated with final URL and status ('completed' or 'failed')
9. Client polls via React Query for status updates and displays images in `ImageGallery`

**Authentication Flow:**

1. Unauthenticated users redirected to `/login`
2. Login form submits to Supabase auth endpoint
3. OAuth callback → `/auth/callback` route exchanges code for session
4. Session stored in cookies via Supabase SSR client
5. Server components read session from cookies for authorization checks
6. User profile stored in `profiles` table with encrypted Gemini API key

**Collection Management Flow:**

1. User creates collection with name and initial settings
2. Collection record inserted in `collections` table with `processing` status
3. Image generation references collection ID
4. `CollectionDetailClient` polls for image updates and displays gallery
5. User can download individual or batch images
6. Collections persisted and reloadable from `/collections` page

**State Management:**

- **Server State:** Supabase database (collections, images, profiles) with session-based auth
- **Client State:** React Query cache for collections and images (polling/refetching), IndexedDB for temporary config/reference images
- **Form State:** React Hook Form with Zod resolver for validation
- **UI State:** Component-level React useState for UI toggles, modals, file selections

## Key Abstractions

**ImageGenerationConfig:**
- Purpose: Encapsulates all user inputs for a photo shoot session
- Examples: `lib/schemas.ts` defines Zod schema, validated in server actions
- Pattern: Immutable config object validated at server boundary, passed through generation pipeline

**Pose System:**
- Purpose: Predefined pose descriptions for different shot types (full_body, upper_body, face)
- Examples: `lib/poses.ts` exports POSES object keyed by shot type
- Pattern: Random pose selection per image to vary outputs, used in prompt refinement

**Storage Abstraction:**
- Purpose: Hide Supabase storage bucket operations behind utility functions
- Examples: `lib/storage.ts` exports `uploadGeneratedImage`, `deleteFolder`
- Pattern: Functions handle bucket selection, path construction, error handling

**Encryption Layer:**
- Purpose: Encrypt user Gemini API keys at rest in database
- Examples: `lib/encryption.ts` exports `encrypt`/`decrypt` using AES-256-GCM
- Pattern: Encrypt on write (profile update), decrypt on read (image generation action)

**Image Persistence:**
- Purpose: Temporary storage of reference images and configuration during creation session
- Examples: `lib/image-persistence.ts` uses IndexedDB for File objects and config
- Pattern: Browser-side persistence to survive page reloads during long generation processes

## Entry Points

**Application Entry Point:**
- Location: `app/layout.tsx`
- Triggers: Server startup, all navigation requests
- Responsibilities: Wrap app with QueryProvider, Toaster, global CSS, fonts, metadata

**Home Page (Image Generator):**
- Location: `app/page.tsx`
- Triggers: User navigation to `/`
- Responsibilities: Check auth (redirect to `/login` if not authenticated), fetch user profile, render `ConfigurationPanel` and `Header`

**Collections Page:**
- Location: `app/collections/page.tsx`
- Triggers: User navigation to `/collections`
- Responsibilities: Fetch all collections for user with nested images, display collection grid with stats

**Collection Detail Page:**
- Location: `app/collections/[id]/page.tsx`
- Triggers: User clicks on collection
- Responsibilities: Fetch collection and images, render gallery with download/delete controls, polling for generation status

**Login Page:**
- Location: `app/login/page.tsx`
- Triggers: Unauthenticated user access
- Responsibilities: Render Supabase auth UI component for OAuth login

**Auth Callback Route:**
- Location: `app/auth/callback/route.ts`
- Triggers: OAuth provider redirects with `code` parameter
- Responsibilities: Exchange authorization code for session, redirect to home or error

**Server Actions:**
- Location: `app/actions/image-actions.ts`, `app/actions/profile-actions.ts`
- Triggers: Form submissions from client components
- Responsibilities: Validate inputs, authenticate user, perform mutations (generate images, update profile)

## Error Handling

**Strategy:** Layered error catching with specific messages for user feedback

**Patterns:**

- **Validation Errors:** Zod schema validation at server action entry point, returns structured error messages
- **API Errors:** Gemini API failures logged with error context, fallback prompts used for prompt refinement
- **Database Errors:** Supabase query errors logged, error state persisted (collection status = 'failed')
- **Storage Errors:** Upload/download failures with retry logic in storage utilities
- **Auth Errors:** Redirects to `/login` if user not authenticated, checks for API key existence before generation
- **Decryption Errors:** Graceful failure with user-facing message if encrypted API key cannot be decrypted
- **File Transfer Errors:** Logs failed Supabase→Gemini transfers, allows continuation if some reference images succeed
- **UI Error Display:** Sonner toast notifications for user-facing errors, console logs for debugging

## Cross-Cutting Concerns

**Logging:**
- Approach: `console.log` and `console.error` with contextual prefixes (e.g., `[Action]`, `[Delete]`)
- Used in: Server actions, storage operations, Gemini API calls for debugging generation pipeline
- No centralized logging service; relies on platform (Vercel) log capture

**Validation:**
- Approach: Zod schemas at server boundaries (ImageGenerationSchema, ApiKeySchema)
- Applied to: Form inputs from client, configuration objects before processing
- Error messages returned to client via toast notifications or form field errors (React Hook Form)

**Authentication:**
- Approach: Supabase SSR client with session cookies
- Checks: `supabase.auth.getUser()` in server components/actions, redirects if unauthorized
- User context: Passed from server to client for profile info (name, avatar)
- API Key Storage: Encrypted Gemini key stored in `profiles.gemini_api_key` column

**Type Safety:**
- Approach: TypeScript strict mode, Zod runtime schemas
- Generated Types: `types/database.types.ts` generated from Supabase schema via CLI
- Type Inference: Config types inferred from Zod schemas (`z.infer<typeof Schema>`)

---

*Architecture analysis: 2026-01-24*
