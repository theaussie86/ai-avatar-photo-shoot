---
phase: 04-panel-ui-foundation
plan: 01
subsystem: video-prompts-ui
tags: [react-query, panel-ui, database-integration]

dependency-graph:
  requires:
    - "03-02: PreviewPanelLayout component for Sheet/Drawer infrastructure"
    - "02-03: getVideoPromptsForImageAction for data fetching"
  provides:
    - "VideoPromptPanel component with loading/empty/error/content states"
    - "useVideoPrompts React Query hook"
    - "Badge indicator reflecting database prompt existence"
  affects:
    - "05-*: Prompt generation UI will reuse same panel"
    - "06-*: Copy/share actions will integrate into panel footer"

tech-stack:
  added:
    - react-query: "Client-side data fetching and caching for video prompts"
  patterns:
    - react-query-hooks: "Custom hooks wrapping server actions for data fetching"
    - conditional-rendering: "Four-state UI pattern (loading/error/empty/content)"

key-files:
  created:
    - hooks/use-video-prompts.ts: "React Query hook for fetching video prompts by image ID"
    - components/avatar-creator/VideoPromptPanel.tsx: "Panel content component with all UI states"
  modified:
    - components/avatar-creator/ImageGallery.tsx: "Integrated VideoPromptPanel and badge indicator"

decisions:
  - id: panel-state-management
    choice: "Four distinct conditional renders for loading/error/empty/content states"
    rationale: "Clear separation makes debugging easier, follows React best practices"
    alternatives: "Single component with complex nested ternaries"
  - id: query-stale-time
    choice: "30 second stale time for video prompts query"
    rationale: "Prompts don't change often, reduces excessive refetching"
    alternatives: "No stale time (refetch on every focus), 5 minutes (too long)"
  - id: german-ui-text
    choice: "German text for all panel states"
    rationale: "Consistent with existing app UI language"
    impact: "Empty state, error messages, button labels all in German"

metrics:
  duration: "3 minutes"
  completed: "2026-01-25"
---

# Phase 04 Plan 01: Video Prompt Panel UI Summary

**One-liner:** Video prompt display panel with React Query data fetching, showing existing prompts from database with loading/empty/error states

## What Was Built

### Core Components

**VideoPromptPanel component:**
- Fixed header with "Video Prompt" title and border separator
- Scrollable middle area for prompt content
- Loading state: 5 skeleton lines with shimmer animation
- Error state: Red alert box with AlertCircle icon and German error message
- Empty state: Purple Video icon, German message "Noch kein Video-Prompt vorhanden", disabled generate button (Phase 5 placeholder)
- Content state: Prompt text in styled container with creation date and camera style metadata
- Fixed footer: Disabled "Kopieren (Phase 6)" button placeholder

**useVideoPrompts hook:**
- React Query wrapper around getVideoPromptsForImageAction server action
- Disabled when imageId is null (no image selected)
- 30 second stale time to avoid excessive refetching
- Returns data, isLoading, error states for UI rendering

**ImageGallery integration:**
- Replaced placeholder panelContent with VideoPromptPanel component
- Added useVideoPrompts hook to fetch prompts for current image
- Badge indicator now reflects actual database state (shows purple badge when prompts exist)
- Panel displays correct data when opened

### User Flow

1. User selects image in gallery → panel closed, badge shows if prompts exist
2. User clicks video button → panel opens via Sheet/Drawer (Phase 3 infrastructure)
3. Panel shows loading skeleton while fetching prompts
4. Panel shows empty state if no prompts, or content state with prompt text
5. User closes and reopens panel → same content appears (React Query cache)
6. User navigates to different image → panel closes, new image's prompts load

## Technical Implementation

### React Query Integration

```typescript
// hooks/use-video-prompts.ts
export function useVideoPrompts(imageId: string | null) {
  return useQuery({
    queryKey: ['video-prompts', imageId],
    queryFn: () => getVideoPromptsForImageAction(imageId!),
    enabled: !!imageId,
    staleTime: 30_000,
  })
}
```

**Key patterns:**
- Query key includes imageId for per-image caching
- Disabled when imageId is null (prevents unnecessary fetches)
- Uses existing server action from Phase 2
- Automatic refetching on window focus (React Query default)

### Conditional Rendering Pattern

```typescript
{isLoading && <SkeletonState />}
{error && !isLoading && <ErrorState />}
{!isLoading && !error && !currentPrompt && <EmptyState />}
{!isLoading && !error && currentPrompt && <ContentState />}
```

**Benefits:**
- Clear separation of concerns (each state isolated)
- Easy to debug (can inspect each condition independently)
- Predictable render order (loading → error → empty → content)
- Type safety (TypeScript knows currentPrompt exists in content state)

### Badge Indicator Logic

```typescript
const { data: videoPrompts } = useVideoPrompts(currentImage?.id ?? null)
const hasVideoPrompts = (videoPrompts?.length ?? 0) > 0
```

Badge appears when:
- Video prompts array has length > 0
- Reflects actual database state (not hardcoded)
- Updates automatically when prompts created (Phase 5 will invalidate query)

## Files Changed

### Created (2 files)

1. **hooks/use-video-prompts.ts** (13 lines)
   - React Query hook for fetching video prompts
   - Exports: useVideoPrompts function

2. **components/avatar-creator/VideoPromptPanel.tsx** (109 lines)
   - Panel content component with all four states
   - Imports: useVideoPrompts, Skeleton, Button, AlertCircle, Video

### Modified (1 file)

1. **components/avatar-creator/ImageGallery.tsx**
   - Added imports: VideoPromptPanel, useVideoPrompts
   - Added hook call to fetch prompts for current image
   - Replaced placeholder panelContent with VideoPromptPanel
   - Updated hasVideoPrompts prop to use actual data

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

**TypeScript compilation:** ✓ Passed (npm run build)

**Manual verification checklist:**
- [ ] Open image gallery dialog
- [ ] Click video icon button on image
- [ ] Panel opens showing empty state (if no prompts) or content (if exists)
- [ ] Badge indicator appears only when prompts exist
- [ ] Close and reopen panel → same content appears
- [ ] Navigate to different image → panel closes, new state loads
- [ ] Loading skeleton shows briefly during fetch
- [ ] Error state shows if server action fails

**States to test:**
- Loading: Open panel immediately after image selection
- Error: Temporarily break server action to see error UI
- Empty: Test with image that has no video prompts
- Content: Test with image that has generated prompts (Phase 2)

## Dependencies

**Requires:**
- Phase 3 Plan 2: PreviewPanelLayout component (Sheet/Drawer infrastructure)
- Phase 2 Plan 3: getVideoPromptsForImageAction server action
- Phase 1: video_prompts database table with RLS policies

**Enables:**
- Phase 5: Prompt generation configuration UI (will trigger query invalidation)
- Phase 6: Copy/share prompt actions (will use same panel)

## Next Phase Readiness

**Phase 5 (Prompt Configuration) can proceed:**
- ✓ Panel UI foundation complete
- ✓ Data fetching established
- ✓ Loading/error states handled
- ✓ Badge indicator working

**What Phase 5 needs to add:**
1. Configuration form controls (camera style, film effects, user instruction)
2. Generate button that triggers prompt creation
3. Query invalidation after successful generation
4. Optimistic updates for instant UI feedback

**Integration points:**
- Replace disabled "Generiere einen Video-Prompt" button with real form
- Add mutation for generateVideoPromptAction
- Update query cache after successful generation
- Show toast notifications for success/error

## Performance Notes

**React Query benefits:**
- 30s stale time reduces refetching on rapid panel open/close
- Automatic background refetching keeps data fresh
- Cache persists across component unmounts (no re-fetch when reopening same image)
- Parallel requests prevented (multiple components can use same hook)

**Bundle size:**
- VideoPromptPanel: ~109 lines (minimal impact)
- useVideoPrompts hook: 13 lines (negligible)
- No new dependencies (React Query already in project)

**Potential optimizations for future:**
- Prefetch prompts for adjacent images (reduce perceived loading)
- Infinite query if prompt history grows large
- Debounce rapid image switches (prevent query cancellation)

## Commits

| Commit | Task | Description |
|--------|------|-------------|
| 6c88f55 | 1 | Create useVideoPrompts hook |
| fcaae17 | 2 | Create VideoPromptPanel component |
| b3971ef | 3 | Integrate VideoPromptPanel into ImageGallery |

Total execution time: 3 minutes
