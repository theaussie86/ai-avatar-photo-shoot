---
phase: 02-core-prompt-generation
plan: 01
subsystem: api
tags: [zod, gemini, video-prompts, constants, german]

# Dependency graph
requires:
  - phase: 01-database-foundation
    provides: video_prompts table schema
provides:
  - Video prompt configuration types and validation schemas
  - German system prompt for Gemini-based video prompt generation
  - Camera style and film effect constants
affects: [02-02-server-action, 05-ui-components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zod schema pattern for video prompt input validation"
    - "German-language system prompts for AI model instruction"
    - "Typed constants with as const for type safety"

key-files:
  created:
    - lib/video-prompt-schemas.ts
    - lib/video-prompts.ts
  modified: []

key-decisions:
  - "Camera styles and film effects use English internal values (snake_case) for code consistency, German labels deferred to UI layer (Phase 5)"
  - "German system prompt optimized for 50-150 word output length based on Runway/Pika/Kling prompt best practices"
  - "Video prompt schema validates max 3 film effects to prevent overly complex prompts"

patterns-established:
  - "lib/*-schemas.ts: Type definitions and Zod validation schemas"
  - "lib/*-prompts.ts: System prompts for AI model instruction"
  - "Constants exported alongside their derived types for reuse in UI and logic"

# Metrics
duration: 2min
completed: 2026-01-25
---

# Phase 2 Plan 1: Video Prompt Schemas and German System Prompt Summary

**Video prompt generation foundation with Zod-validated schemas, typed constants, and German system prompt for Runway/Pika/Kling optimization**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-25T14:49:37Z
- **Completed:** 2026-01-25T14:51:05Z
- **Tasks:** 2
- **Files modified:** 2 (created)

## Accomplishments
- Created video prompt configuration schema with Zod validation (imageId, userInstruction, cameraStyle, filmEffects)
- Defined 6 camera styles (cinematic, slow_motion, zoom_in, orbit, dolly, static) and 5 film effects (dramatic, soft, golden_hour, noir, dreamy)
- Implemented German-language system prompt instructing Gemini to generate 50-150 word video-ready prompts optimized for AI video tools

## Task Commits

Each task was committed atomically:

1. **Task 1: Create video prompt schemas and constants** - `a35e7a9` (feat)
2. **Task 2: Create German system prompt for video generation** - `a5e97fd` (feat)

## Files Created/Modified
- `lib/video-prompt-schemas.ts` - Exports CAMERA_STYLES, FILM_EFFECTS constants, VideoPromptGenerationSchema (Zod), VideoPromptGenerationConfig type, CameraStyleType, FilmEffectType
- `lib/video-prompts.ts` - Exports VIDEO_PROMPT_SYSTEM_PROMPT (German system instruction for Gemini)

## Decisions Made

**1. English internal values for constants**
- **Decision:** Camera styles and film effects use English snake_case internally (e.g., "slow_motion", "golden_hour")
- **Rationale:** Code consistency across system; German labels will be added in UI layer (Phase 5) via i18n or display mapping
- **Impact:** Simplifies server-side logic, centralizes translation concerns

**2. 50-150 word prompt length specification**
- **Decision:** German system prompt instructs Gemini to generate 50-150 word outputs
- **Rationale:** Optimal length for AI video tools based on Runway/Pika/Kling documentation (too short lacks detail, too long adds noise)
- **Impact:** Consistent prompt quality across generations

**3. Max 3 film effects limit**
- **Decision:** Schema validates maximum 3 film effects per generation
- **Rationale:** Prevents overly complex prompts that confuse video AI models with conflicting style directives
- **Impact:** Enforces quality constraints at validation layer

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward schema and constant definitions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 2 Plan 2 (Server Action):**
- VideoPromptGenerationSchema available for server action input validation
- VIDEO_PROMPT_SYSTEM_PROMPT ready for Gemini API calls
- Types exported for server action return values

**No blockers:**
- All exports verified via TypeScript compilation
- Schema validation ready for integration
- German prompt tested for syntax (runtime validation deferred to Phase 2 Week 1 checkpoint)

---
*Phase: 02-core-prompt-generation*
*Completed: 2026-01-25*
