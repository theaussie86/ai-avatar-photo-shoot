# Architecture Decisions

Key decisions made during development of the AI Avatar Photo Shoot app.

## v1.0 Video Prompt Feature (2026-01)

| Decision | Rationale |
|----------|-----------|
| Side panel (Sheet) over modal | Image stays visible during prompt editing |
| Variants over overwrite | Users keep prompt history, can compare |
| English video prompts | Runway/Pika/Kling work better with English |
| Gemini for prompt generation | Already integrated, analyzes images |
| 30s React Query staleTime | Prompts rarely change, reduces refetching |
| Clipboard API + execCommand fallback | Browser compatibility |
| Non-blocking AI suggestions | Graceful degradation on error |
| Composite state pattern | Avoids React 19 useEffect setState lint errors |

## Core Architecture

| Decision | Rationale |
|----------|-----------|
| BYOK (Bring Your Own Key) | Users provide Gemini API keys - no billing complexity |
| AES-256-GCM encryption | Secure API key storage at rest |
| Server Actions over API routes | Simpler auth flow, better type safety |
| React Query for async state | Polling, caching, optimistic updates |
| Supabase RLS | Row-level security enforces data isolation |
| IndexedDB for session persistence | Reference images survive page reloads |

## Out of Scope (by design)

- Video generation in-app - Users copy prompts to external tools (Runway, Pika, Kling)
- Multi-language UI - German only, English prompts for video AI
- Prompt templates - Variants created per-image instead
