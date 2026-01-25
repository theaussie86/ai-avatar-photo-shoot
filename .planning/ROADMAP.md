# Roadmap: AI Avatar Photo Shoot - Video Prompt Generation

## Overview

This roadmap delivers video prompt generation capability to the AI Avatar Photo Shoot app. Users will be able to open a side panel from any generated image, configure camera movements and film effects, and generate AI-powered video prompts optimized for external tools like Runway, Pika, and Kling. The journey starts with database foundation and core Gemini integration (Phase 1-2), builds the panel UI and basic generation workflow (Phase 3-4), adds variant management and copy functionality (Phase 5-6), and finishes with AI-powered suggestions and quality feedback (Phase 7). The roadmap validates the critical German language requirement early in Phase 2 and enables iterative refinement through multi-variant support.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Database Foundation** - Video prompts table with RLS and variant tracking
- [x] **Phase 2: Core Prompt Generation** - Gemini integration for video prompt generation (English prompts, German UI)
- [x] **Phase 3: Image Preview Enhancement** - Improved layout and panel integration points
- [x] **Phase 4: Panel UI Foundation** - Side panel component with open/close and basic display
- [x] **Phase 5: Configuration Controls** - Camera style and film effect selection
- [x] **Phase 6: Copy & Save System** - Clipboard copy with feedback and database persistence
- [ ] **Phase 7: Variants & Navigation** - Multiple prompts per image with navigation UI
- [ ] **Phase 8: AI Suggestions & Quality Feedback** - Contextual suggestions and prompt length guidance

## Phase Details

### Phase 1: Database Foundation
**Goal**: Database schema supports video prompts with user ownership, variant tracking, and proper cascading
**Depends on**: Nothing (first phase)
**Requirements**: SAVE-03, SAVE-04, VAR-01
**Success Criteria** (what must be TRUE):
  1. Video prompts table exists with all required fields (prompt_text, camera_style, film_effect, status, variant_order)
  2. RLS policies enforce user ownership (users can only access their own prompts)
  3. Deleting an image automatically deletes associated video prompts (CASCADE works)
  4. Multiple variants can be stored per image with proper ordering
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md - Create video_prompts table with RLS policies and CASCADE delete

### Phase 2: Core Prompt Generation
**Goal**: System generates video prompts from images using Gemini (English prompts for AI tool compatibility, German UI preserved)
**Depends on**: Phase 1
**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04
**Success Criteria** (what must be TRUE):
  1. Server action analyzes image and generates video prompt via Gemini
  2. Generated prompts include image content, user instructions, and configuration
  3. Language strategy validated (English prompts chosen for optimal video AI compatibility)
  4. Async generation creates pending record, updates to completed after Gemini responds
  5. Failed generations update status to failed with error message
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md - Video prompt schemas and system prompt
- [x] 02-02-PLAN.md - Server action for video prompt generation
- [x] 02-03-PLAN.md - Language validation checkpoint (English prompts, German UI)

**Completed Note**: Language checkpoint executed fallback strategy - English prompts for optimal Runway/Pika/Kling compatibility, German UI labels preserved for user experience.

### Phase 3: Image Preview Enhancement
**Goal**: Image preview component has improved layout and integration points for video prompt panel
**Depends on**: Phase 2
**Requirements**: PREV-01, PREV-02, PREV-03
**Success Criteria** (what must be TRUE):
  1. Image preview shows images with proper sizing and aspect ratio handling
  2. Layout adapts responsively when panel opens (desktop) or drawer appears (mobile)
  3. Video prompt trigger button appears in preview UI (non-functional styling)
  4. Preview component structure supports panel integration without breaking existing functionality
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md - Enhanced preview component with letterbox layout and trigger button
- [x] 03-02-PLAN.md - Responsive layout container with sheet/drawer panel integration

**Completed Note**: Letterbox layout with object-contain prevents cropping. Responsive panel layout: side sheet (desktop ≥1024px) and bottom drawer (mobile). VideoPromptButton triggers panel toggle.

### Phase 4: Panel UI Foundation
**Goal**: Users can open and close video prompt panel without data loss
**Depends on**: Phase 3
**Requirements**: PANEL-01, PANEL-02, PANEL-03, PANEL-04
**Success Criteria** (what must be TRUE):
  1. User clicks video icon button and panel opens as side panel (desktop) or drawer (mobile)
  2. Panel displays placeholder content (scrollable area ready for prompt text)
  3. User closes panel and state persists (reopening shows same content)
  4. Panel layout is responsive (Sheet on desktop >=1024px, Drawer on mobile)
**Plans**: 1 plan

Plans:
- [x] 04-01-PLAN.md - VideoPromptPanel component with loading/empty/error states and database integration

**Completed Note**: VideoPromptPanel with 4 states (loading/error/empty/content). useVideoPrompts hook provides React Query integration. Badge indicator reflects actual database state.

### Phase 5: Configuration Controls
**Goal**: Users can select camera styles and film effects that influence prompt generation
**Depends on**: Phase 4
**Requirements**: CONF-01, CONF-02, CONF-03
**Success Criteria** (what must be TRUE):
  1. Panel displays camera style options (Cinematic, Slow Motion, Zoom-In, Orbit, Dolly, Statisch) as single-select controls
  2. Panel displays film effect options (Dramatisch, Weich, Golden Hour, Noir, Vertraumt) as single-select controls
  3. Selected options visually indicate active state
  4. Selected options are passed to Gemini during prompt generation
  5. Generated prompts reflect chosen camera style and film effect
**Plans**: 1 plan

Plans:
- [x] 05-01-PLAN.md - Configuration chips and generation integration

**Completed Note**: Chip-based camera style (6 options) and film effect (5 options) selection integrated into VideoPromptPanel. React Query mutation with cache invalidation enables prompt generation. Default selections: Cinematic + Weich.

### Phase 6: Copy & Save System
**Goal**: Users can copy prompts to clipboard and prompts persist in database
**Depends on**: Phase 5
**Requirements**: SAVE-01, SAVE-02
**Success Criteria** (what must be TRUE):
  1. User clicks "Kopieren" button and prompt text copies to clipboard
  2. Toast notification confirms successful copy
  3. Copy action works on both desktop and mobile
  4. Generated prompts save to database automatically (linked to image)
  5. Reopening panel for same image loads previously generated prompt
**Plans**: 1 plan

Plans:
- [x] 06-01-PLAN.md - Copy button with clipboard functionality and visual feedback

**Completed Note**: useCopyToClipboard hook with Clipboard API + execCommand fallback, haptic feedback on mobile. Copy button below prompt text with checkmark feedback and "Kopiert!" toast.

### Phase 7: Variants & Navigation
**Goal**: Users can create and navigate between multiple prompt variants per image
**Depends on**: Phase 6
**Requirements**: VAR-02, VAR-03, VAR-04
**Success Criteria** (what must be TRUE):
  1. User sees variant counter in panel header (e.g., "2 von 3")
  2. User can click prev/next arrows to navigate between variants
  3. User can click "+Neu" button to create new variant
  4. Each variant maintains its own configuration (camera style, film effect)
  5. Variant order persists correctly across sessions
**Plans**: TBD

Plans:
- [ ] 07-01: TBD during planning

### Phase 8: AI Suggestions & Quality Feedback
**Goal**: Users receive AI-powered action suggestions and prompt quality guidance
**Depends on**: Phase 7
**Requirements**: SUGG-01, SUGG-02, SUGG-03, SUGG-04, FEED-01
**Success Criteria** (what must be TRUE):
  1. Panel displays 3-5 AI-generated suggestions based on image analysis (e.g., "Make character smile")
  2. Panel displays fixed action suggestions (lacheln, winken, nicken, drehen)
  3. User can click suggestion to populate instruction field
  4. Selected suggestions show visual active state
  5. Panel displays word count and length indicator (green: 50-150 words, red: >200 words)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Database Foundation | 1/1 | Complete | 2026-01-25 |
| 2. Core Prompt Generation | 3/3 | Complete | 2026-01-25 |
| 3. Image Preview Enhancement | 2/2 | Complete | 2026-01-25 |
| 4. Panel UI Foundation | 1/1 | Complete | 2026-01-25 |
| 5. Configuration Controls | 1/1 | Complete | 2026-01-25 |
| 6. Copy & Save System | 1/1 | Complete | 2026-01-25 |
| 7. Variants & Navigation | 0/TBD | Not started | - |
| 8. AI Suggestions & Quality Feedback | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-25*
*Last updated: 2026-01-25*
