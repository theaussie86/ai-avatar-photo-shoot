# Phase 1: Database Foundation - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Database schema supporting video prompts with user ownership, variant tracking, and cascading deletes. This phase creates the `video_prompts` table with RLS policies. No UI, no API endpoints, no generation logic — just the data layer.

</domain>

<decisions>
## Implementation Decisions

### Prompt field design
- `prompt_text` max length: 2000 characters (database-enforced)
- Separate `user_instruction` field to store user's original input (enables regeneration with same input)
- `model_name` field to track which Gemini model generated the prompt
- No `target_tool` field — prompts are tool-agnostic, user decides where to use them

### Variant ordering
- Order by `created_at` timestamp (no explicit order column)
- No maximum variants per image — unlimited
- Hard delete for variant removal (no soft delete)
- `is_primary` boolean flag — one variant per image can be marked primary

### Status lifecycle
- Four statuses: `draft`, `pending`, `completed`, `failed`
- No extra timestamp fields beyond `created_at` and `updated_at`
- Error storage: `error_code` (text) + `error_message` (text) for structured error handling
- No auto-cleanup of drafts — persist until user deletes or completes

### Configuration storage
- `camera_style` and `film_effect` stored as text fields (not enums)
- Both optional with defaults: camera_style = 'statisch', film_effect = null (none)
- Single-select for camera style
- Multi-select for film effects — store as text array or JSON

### Claude's Discretion
- Exact column naming conventions (snake_case standard)
- Index strategy for common queries
- RLS policy implementation details
- Whether to use a check constraint for status values

</decisions>

<specifics>
## Specific Ideas

- Film effects should support multi-select, so storage must accommodate multiple values (array or JSON)
- Primary variant flag enables "quick copy" workflows in later phases

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-database-foundation*
*Context gathered: 2026-01-25*
