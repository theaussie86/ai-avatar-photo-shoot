# Codebase Concerns

**Analysis Date:** 2026-01-24

## Tech Debt

**Excessive console logging in production code:**
- Issue: Heavy logging throughout `app/actions/image-actions.ts` (18+ console statements) with request IDs like `[Task ${imageId}]` and `[Action]` prefixes. While helpful for debugging, this logs sensitive information about API operations and file transfers to server logs.
- Files: `app/actions/image-actions.ts` (lines 56, 60, 91, 147, 155, 250, 285, 292, 310, 323, 334, 353, 375, 383, 400, 413, 444, 453, 456, 466)
- Impact: Increased server log verbosity, potential information disclosure, harder to identify actual errors in production logs
- Fix approach: Replace console logs with structured logging using a logging service (Winston, Pino, or Sentry). Reduce logging to essential operations only. Use debug-level logging for development.

**Type safety gaps with `any` types:**
- Issue: 12+ instances of `any` type usage throughout action files bypasses TypeScript's type safety. Examples: `uploadResult: any`, `parts: any[]`, `result: any`, `err: any`
- Files: `app/actions/image-actions.ts` (lines 80, 142, 153, 166-173, 288, 355, 365, 416-420), `lib/image-generation.ts` (line 39, 99, 100)
- Impact: Silent type mismatches, harder to refactor, increased runtime errors, reduced IDE autocomplete help
- Fix approach: Create proper TypeScript interfaces for API responses from Google GenAI SDK. Define union types for error objects. Update method signatures to replace `any`.

**Unvalidated API response parsing:**
- Issue: Code assumes specific response structures from Gemini API without defensive checks. Line 371-377 in `image-actions.ts` attempts to access nested properties that may not exist.
- Files: `app/actions/image-actions.ts` (lines 88, 113, 117-125, 371-377)
- Impact: Silent failures when API response format changes, user's image generation fails without proper error message
- Fix approach: Create response validators using Zod schema. Add explicit checks for required fields before accessing properties.

## Known Bugs

**Race condition in Gemini file cleanup:**
- Symptoms: Multiple images referencing the same Gemini file may result in premature file deletion. The cleanup logic at `image-actions.ts:432-467` queries for "other pending or failed images" but doesn't account for images currently being processed that haven't committed cleanup status.
- Files: `app/actions/image-actions.ts` (lines 435-467), specifically the cleanup check at line 438-441
- Trigger: Generate multiple images with same reference image, fail one image while another is still processing
- Workaround: Re-trigger failed image generation within 2-3 minutes before cleanup runs
- Fix approach: Implement reference counting system in database. Store file usage count, decrement only when actual generation completes. Add transaction-safe deletion logic.

**Incomplete error recovery in generateImagesAction:**
- Symptoms: If collection creation succeeds but prompt refinement fails for individual images, the collection is left in "processing" state with no images. User sees hanging session.
- Files: `app/actions/image-actions.ts` (lines 175-220)
- Trigger: Network timeout during prompt refinement, Gemini API intermittent failure, or Promise.all() partial failure
- Workaround: User must manually delete collection and retry
- Fix approach: Implement partial success handling. Update collection status based on successful image count. Store error details for failed images. Implement exponential backoff for prompt refinement retries.

**Pose selection with shuffle could be inefficient:**
- Symptoms: `Math.random()` based sorting (line 163) doesn't guarantee proper shuffling for large arrays or may repeat poses if array is small
- Files: `lib/image-generation.ts` (line 163)
- Trigger: Generating 20+ images with only 3-5 poses available
- Impact: Users may see repeated poses more frequently than expected
- Fix approach: Implement Fisher-Yates shuffle algorithm. Pre-compute shuffled array once per generation batch.

## Security Considerations

**Unencrypted API keys at rest during transfer:**
- Risk: Gemini API keys are decrypted on every image generation call and passed through multiple function parameters. If Node.js process crashes, key remains in memory.
- Files: `app/actions/image-actions.ts` (lines 44, 208-215, 243-248)
- Current mitigation: Keys encrypted in database, decryption only when needed
- Recommendations:
  1. Implement server-side environment variable caching with expiration
  2. Use Supabase RLS to enforce that only authenticated user can trigger generation with their own key
  3. Consider implementing key rotation system with time-limited tokens
  4. Add audit logging for all API key access

**Authorization checks incomplete on collection operations:**
- Risk: Collection deletion and image operations verify `user_id` match, but there's no additional verification of session validity or rate limiting
- Files: `app/actions/image-actions.ts` (lines 481-486, 523-528, 573-578)
- Current mitigation: Supabase RLS on tables
- Recommendations: Add session validity checks, implement rate limiting per user, add audit logging for destructive operations

**Gemini file URIs exposed in metadata:**
- Risk: Gemini file URIs stored in database metadata may be accessible to other authenticated users if database query permissions aren't properly restricted
- Files: `app/actions/image-actions.ts` (line 196)
- Current mitigation: RLS on images table
- Recommendations: Verify RLS policies explicitly deny cross-user access to metadata field, consider storing URIs in separate encrypted column

## Performance Bottlenecks

**Sequential image generation with parallel prompt refinement:**
- Problem: Line 175-220 refines prompts for all images in parallel (Promise.all) which can spike CPU/memory. Then tasksToTrigger array is created but never processed asynchronously.
- Files: `app/actions/image-actions.ts` (lines 175-220)
- Cause: Prompt refinement calls Gemini API which can be slow (2-5s each), all in parallel. No background job queue means image generation never actually fires after action returns.
- Improvement path:
  1. Implement job queue (Bull, RabbitMQ, Supabase Functions)
  2. Limit concurrent prompt refinements to 3-5 parallel requests
  3. Actually trigger `generateImageTask` asynchronously (currently tasksToTrigger is unused after return)

**No connection pooling for Supabase client:**
- Problem: New Supabase client created on every action invocation
- Files: `app/actions/image-actions.ts` (line 24), `app/actions/profile-actions.ts` (line 19)
- Cause: `createClient()` creates new ServerClient per request
- Improvement path: Consider singleton pattern for client reuse, or ensure Supabase SDK handles pooling internally

**Synchronous Gemini file status polling with hardcoded 2s delay:**
- Problem: Lines 315-331 poll Gemini file status with 10 attempts x 2s = 20s max wait per reference image. With 3 images, that's 60s blocking time.
- Files: `app/actions/image-actions.ts` (lines 315-331)
- Cause: Waiting for Gemini Files API to reach ACTIVE state before generation
- Improvement path: Implement exponential backoff, or remove polling if Gemini handles non-ACTIVE files gracefully

**Storage.deleteFolder operation lists all files linearly:**
- Problem: Line 36-39 lists all files in folder without pagination. No limit on results.
- Files: `lib/storage.ts` (lines 35-44)
- Cause: Supabase list() API likely has default limit (1000?), could miss files in large collections
- Improvement path: Implement pagination loop, handle `nextName` cursor for continuation

## Fragile Areas

**generateImageTask function design:**
- Files: `app/actions/image-actions.ts` (lines 242-470)
- Why fragile: This 230-line function handles 5+ distinct responsibilities: file status checking, prompt assembly, API calls, storage operations, database updates, cleanup. Single point of failure affects all operations. The finally block at line 432 has cleanup logic that queries the database, adding risk if DB is down.
- Safe modification: Break into smaller functions by responsibility (uploadReferences, generateImage, saveToStorage, updateDatabase, cleanupReferences). Test each independently.
- Test coverage: test file tests happy path but not failure cases in middle of generation (e.g., failure at line 365 Gemini call vs failure at line 389 storage upload)

**Image status field used as state machine:**
- Files: `app/actions/image-actions.ts`, `types/database.types.ts`
- Why fragile: Status field ('pending', 'processing', 'completed', 'failed') is the only state indicator. No timestamp tracking of state transitions. Race conditions possible if status updated twice rapidly.
- Safe modification: Add `status_updated_at` timestamp, implement state transition validation (only allow pending -> processing -> completed, not processing -> pending), add retry counter field
- Test coverage: No tests for concurrent status updates

**Reference image transfer flow:**
- Files: `app/actions/image-actions.ts` (lines 49-105)
- Why fragile: Images uploaded to Supabase (`uploaded_images/` prefix), transferred to Gemini, then deleted from Supabase (lines 95-97). If Gemini upload fails but Supabase deletion succeeds, image data is lost. No recovery path.
- Safe modification: Don't delete from Supabase until Gemini generation completes successfully. Add reference counter. Implement cleanup job that runs periodically.
- Test coverage: Tests don't cover failure during Supabase deletion

**Encryption module global state dependency:**
- Files: `lib/encryption.ts` (lines 12-21, 38-46)
- Why fragile: Both encrypt/decrypt require ENCRYPTION_SECRET from process.env with no fallback. No caching, key validation on every call. If env var changes, all decrypted keys become invalid.
- Safe modification: Cache validated key on startup, validate once at server start, throw error if missing. Consider storing IV/tag/data as separate fields instead of colon-separated string.
- Test coverage: `encryption.test.ts` exists but tests should verify error handling

## Scaling Limits

**Single database connection for concurrent image generation:**
- Current capacity: Supabase supports ~500 concurrent connections by default. If all image tasks use single pool, limited concurrency.
- Limit: Beyond ~100 concurrent generations, database locks increase, queries slow down
- Scaling path:
  1. Confirm Supabase client uses connection pooling (likely does with SSR adapter)
  2. Implement request batching for database updates
  3. Consider separate read/write clients
  4. Monitor connection usage with Supabase dashboard

**Gemini Files API upload/download bandwidth:**
- Current capacity: Google GenAI SDK limited by network throughput per request
- Limit: If generating 1000 images/day with 3MB reference images each, that's 3TB/day potential
- Scaling path:
  1. Implement client-side compression before upload
  2. Consider storing reference images in CDN, pass URLs instead of uploads
  3. Implement batch generation endpoints to reduce per-image overhead
  4. Monitor quota usage in Google Cloud Console

**Memory usage in Promise.all image preparation:**
- Current capacity: generateImagesAction line 175 creates array of Promises for all images at once
- Limit: 40 images x 5MB reference image handling = 200MB in memory during generation
- Scaling path: Implement chunked Promise processing, generate in batches of 5-10 images

## Dependencies at Risk

**@google/genai SDK version management:**
- Risk: Currently using `^1.35.0`. Major version bumps may break API response structures. No version lock strategy.
- Files: `package.json` (line 17)
- Impact: Automatic dependency updates could break image generation without test coverage
- Migration plan:
  1. Pin to exact version in package.json (1.35.0 instead of ^1.35.0)
  2. Implement test suite that validates API responses
  3. Create SDK wrapper/adapter layer to insulate from API changes
  4. Monitor Google Cloud SDK release notes monthly

**Supabase SDKs with automatic updates:**
- Risk: `@supabase/supabase-js` `^2.89.0` and `@supabase/ssr` `^0.8.0` will auto-update
- Files: `package.json` (lines 26-27)
- Impact: Breaking changes in auth flow or RLS implementation
- Migration plan: Pin versions, add integration tests that verify auth callback flow, subscribe to Supabase release notes

**Node.js version drift:**
- Risk: No .nvmrc or Node version specified. Global `crypto` module usage assumes Node 18+
- Files: `lib/encryption.ts` (line 1)
- Impact: Users on Node 16 will hit runtime errors with Blob/Buffer operations
- Migration plan: Create .nvmrc with minimum Node 18, add precheck script

## Missing Critical Features

**No error recovery queue:**
- Problem: Failed image generation has no automatic retry. User must manually re-trigger. No exponential backoff, no max retry count.
- Blocks: Enterprise use case where 100% success rate is required
- Fix approach: Implement job queue with configurable retry policy (3 retries with exponential backoff)

**No image generation progress websocket:**
- Problem: Frontend polls for status updates. No real-time push notifications when images complete.
- Blocks: User experience improvements, batch operation notifications
- Fix approach: Implement Supabase real-time subscriptions or custom websocket service

**No audit logging:**
- Problem: No record of who generated what, when, or what settings were used. Only database records exist.
- Blocks: Compliance requirements, user support debugging
- Fix approach: Create audit_logs table, log all generation operations with user_id, timestamp, config

**No image download/export batch operation:**
- Problem: Users must download images individually. No zip export for entire collection.
- Blocks: Workflow efficiency
- Fix approach: Create background job for batch zip creation, store in bucket, generate signed URL

## Test Coverage Gaps

**Image generation with API failures:**
- What's not tested: What happens if Gemini returns invalid response at line 365, or if storage upload fails at line 389, or if database update fails at line 401. Current tests mock happy path only.
- Files: `app/actions/image-actions.test.ts` (lines 194-222 test failure but not partial failure scenarios)
- Risk: Production failures in error handling path won't be caught
- Priority: High - affects user experience on edge cases

**Reference image transfer failure scenarios:**
- What's not tested: Supabase download fails (line 63), Gemini upload fails (line 80), Supabase cleanup fails (line 95). Current tests mock all storage operations as success.
- Files: `app/actions/image-actions.ts` (lines 49-105), test file doesn't cover
- Risk: Data loss or orphaned files in production
- Priority: High

**Concurrent image generation race conditions:**
- What's not tested: Two users generating images simultaneously, same reference image, cleanup races. No test fixtures for concurrent scenarios.
- Files: `app/actions/image-actions.ts` (lines 315-331 polling, lines 435-467 cleanup)
- Risk: Silent data loss, file cleanup errors in concurrent deployments
- Priority: Medium

**Database constraint violations:**
- What's not tested: What happens if images collection_id doesn't exist (foreign key), or if user_id doesn't match profile (RLS). Only happy path tested.
- Files: `app/actions/image-actions.test.ts`
- Risk: Opaque errors returned to user
- Priority: Medium

**Encryption key rotation:**
- What's not tested: Decrypting with wrong key format, key length validation. `encryption.test.ts` likely tests basic encrypt/decrypt only.
- Files: `lib/encryption.ts`, `lib/encryption.test.ts`
- Risk: Silent failures when key format changes
- Priority: Low (depends on how key management is handled)

---

*Concerns audit: 2026-01-24*
