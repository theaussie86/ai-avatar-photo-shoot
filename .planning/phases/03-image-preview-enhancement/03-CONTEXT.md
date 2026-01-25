# Phase 3: Image Preview Enhancement - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Enhance the image preview component with improved layout and integration points for the upcoming video prompt panel. Users see a polished preview with proper aspect ratio handling and a trigger button for video prompts. The actual panel functionality (Phase 4) and generation logic (Phase 2, done) are separate.

</domain>

<decisions>
## Implementation Decisions

### Layout & sizing
- Contain (letterbox) aspect ratio handling — show full image with empty space if needed, no cropping
- Subtle gray background behind letterboxed images
- Preview area shrinks when panel opens (side-by-side layout on desktop)
- Minimum ~50% width for preview even when panel is open

### Trigger button placement
- Corner overlay position — fixed icon button in bottom-right corner of image
- Always visible (not hover-reveal)
- Video camera icon to represent "video prompt" action

### Responsive behavior
- Desktop (≥1024px): Side panel
- Mobile (<1024px): Bottom drawer slides up
- When mobile drawer opens, preview dims/blurs behind it (focus on drawer content)
- No special handling for landscape images on mobile — same rules apply

### Visual states
- Badge/dot indicator on button when prompts already exist for the image
- Subtle scale/shadow hover effect on image preview
- Highlighted border on preview when its panel is open (shows association)
- Skeleton/shimmer loading state while image loads

### Claude's Discretion
- Exact animation timing and easing
- Specific gray tone for letterbox background
- Badge styling details (color, size, position on button)
- Border highlight color/thickness when panel is open

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches that match existing app patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-image-preview-enhancement*
*Context gathered: 2026-01-25*
