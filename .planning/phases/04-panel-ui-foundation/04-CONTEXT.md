# Phase 4: Panel UI Foundation - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can open and close the video prompt panel without data loss. The panel displays inside the existing Sheet (desktop) / Drawer (mobile) components from Phase 3. This phase covers panel content, state management, and loading states. Configuration controls (camera/effects) and copy functionality are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Panel content layout
- Single scroll area — everything in one scrollable container (prompt text, controls, actions flow vertically)
- Action buttons (Generate, Copy) at bottom of scroll area — user scrolls to reach them
- Compact padding/spacing — minimal spacing to maximize content area
- Fixed height prompt text area — scrolls within its container if content overflows

### State persistence
- Panel content held in React state during session — survives close/reopen but not page refresh
- State resets on image change — switching images clears panel state (simpler UX)
- Panel open/closed state persisted via URL parameter: `?panel=video-prompt`
- Named panel type in URL allows future extensibility for additional panels

### Loading & empty states
- Empty state: Empty prompt text area + CTA button "Generiere einen Video-Prompt"
- Loading state: Skeleton shimmer placeholder where prompt text will appear
- Error handling: Toast notification for immediate feedback + inline error message persists in panel
- Generate button: Disabled with loading state during generation (shows spinner/loading text)

### Panel header design
- Title: "Video Prompt" — simple, clear label
- Close button positioned top right — standard convention
- No additional header actions — all actions live in panel body
- Subtle border separates header from scrollable content

### Claude's Discretion
- Exact skeleton shimmer dimensions and animation
- Specific spacing values within compact constraint
- Error message wording and retry button styling
- Scroll container implementation details

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User wants compact, efficient panel that matches app conventions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-panel-ui-foundation*
*Context gathered: 2026-01-25*
