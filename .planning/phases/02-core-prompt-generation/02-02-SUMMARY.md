---
phase: 02-core-prompt-generation
plan: 02
subsystem: api
tags: [server-actions, gemini, video-prompts, authentication, german]

# Dependency graph
requires:
  - phase: 02-core-prompt-generation
    plan: 01
    provides: VideoPromptGenerationSchema and VIDEO_PROMPT_SYSTEM_PROMPT
  - phase: 01-database-foundation
    provides: video_prompts table, images table, RLS policies
provides:
  - Server action for generating German video prompts from images
  - Server action for fetching video prompts by image ID
  - Full async generation flow with pending/completed/failed status tracking
affects: [03-ui-components, 04-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server action pattern with Zod validation and user authentication"
    - "Gemini Files API integration for image upload and processing"
    - "Database status tracking (pending → completed/failed)"
    - "Error handling with database status updates"

key-files:
  created:
    - app/actions/video-prompt-actions.ts
  modified: []

key-decisions:
  - "System prompt passed via config.systemInstruction (matching image-generation.ts pattern)"
  - "German labels for camera styles and film effects applied in user message to Gemini"
  - "Image ownership verified via collection user_id relationship"
  - "Gemini file cleanup after prompt generation to prevent quota exhaustion"
  - "10-attempt polling with 2-second intervals for Gemini file processing (ACTIVE state)"

patterns-established:
  - "app/actions/*-actions.ts: Server actions following 10-step flow: validate → auth → fetch API key → verify ownership → create pending record → fetch resources → call Gemini → update completed/failed"
  - "Error handling updates database status to 'failed' with error_message before throwing"
  - "Helper actions for data retrieval alongside generation actions"

# Metrics
duration: 2.5min
completed: 2026-01-25
---

# Phase 2 Plan 2: Video Prompt Generation Server Action Summary

**Complete server action for generating German video prompts from images using Gemini vision model with full error handling and status tracking**

## Performance

- **Duration:** 2.5 min
- **Started:** 2026-01-25T14:53:17Z
- **Completed:** 2026-01-25T14:56:06Z
- **Tasks:** 2 (combined in single file)
- **Files modified:** 1 (created)

## Accomplishments

- Created `generateVideoPromptAction` server action with complete async flow (validate → auth → create pending → Gemini → update)
- Implemented image ownership verification via collection relationship
- Integrated Gemini Files API for image upload with processing status polling
- Applied German labels for camera styles and film effects in Gemini prompt
- Added error handling that updates video_prompts status to 'failed' before throwing
- Created `getVideoPromptsForImageAction` helper for fetching prompts by image ID
- Configured system instruction via config object (matching existing pattern)
- Implemented Gemini file cleanup to prevent quota issues

## Task Commits

Each task was committed atomically:

1. **Tasks 1-2: Create video prompt generation server action** - `b123e53` (feat)

## Files Created/Modified

- `app/actions/video-prompt-actions.ts` - Exports generateVideoPromptAction (main generation flow), getVideoPromptsForImageAction (fetch helper)

## Decisions Made

**1. System instruction in config object**
- **Decision:** Pass VIDEO_PROMPT_SYSTEM_PROMPT via `config: { systemInstruction }` parameter
- **Rationale:** Matches existing pattern in lib/image-generation.ts refinePrompt function
- **Impact:** Consistent API usage across codebase

**2. German label mapping in server action**
- **Decision:** Define cameraStyleLabels and filmEffectLabels mappings in server action, apply in user message to Gemini
- **Rationale:** English internal values (from 02-01) translated to German for Gemini prompt, keeping schema clean
- **Impact:** German prompt generation without polluting schemas with UI labels

**3. Image ownership verification via collection relationship**
- **Decision:** Fetch image with collections(user_id) join, verify user owns collection
- **Rationale:** RLS policies enforce access via collections table, explicit verification adds clarity
- **Impact:** Prevents unauthorized prompt generation on other users' images

**4. Gemini file cleanup after generation**
- **Decision:** Delete uploaded file from Gemini Files API after prompt generation completes
- **Rationale:** Prevent quota exhaustion from accumulated uploads (unlike image generation which reuses files)
- **Impact:** Each prompt generation is self-contained, no shared file state

**5. 10-attempt polling for file processing**
- **Decision:** Poll Gemini Files API status up to 10 times with 2-second intervals
- **Rationale:** Files must reach ACTIVE state before use; reasonable timeout prevents infinite waits
- **Impact:** Reliable file processing detection, logged warnings if timeout exceeded

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**TypeScript compilation error (resolved)**
- **Issue:** Initial implementation had `systemInstruction` at top level of generateContent params
- **Fix:** Moved to `config: { systemInstruction }` to match Gemini SDK signature
- **Time:** <1 min to identify and fix via comparison with lib/image-generation.ts

## User Setup Required

None - uses existing Gemini API key from profiles table (encrypted via lib/encryption.ts).

## Next Phase Readiness

**Ready for Phase 3 (UI Components):**
- generateVideoPromptAction ready for UI integration
- getVideoPromptsForImageAction ready for loading existing prompts
- Status tracking (pending/completed/failed) supports real-time UI updates
- German prompt output ready for display and export

**Ready for Phase 2 German validation checkpoint:**
- Full end-to-end flow implemented (schema → prompt → action)
- German prompts generated via VIDEO_PROMPT_SYSTEM_PROMPT
- Can test with real images in Week 1 validation

**No blockers:**
- All imports resolve correctly
- TypeScript compilation successful
- Database operations use correct table names
- Error handling prevents orphaned pending records

---
*Phase: 02-core-prompt-generation*
*Completed: 2026-01-25*
