# Phase 5: Configuration Controls - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Users select camera styles and film effects that influence prompt generation. The panel displays single-select controls for camera style (Cinematic, Slow Motion, Zoom-In, Orbit, Dolly, Statisch) and film effect (Dramatisch, Weich, Golden Hour, Noir, Vertraumt). Selected options are passed to Gemini and reflected in generated prompts.

</domain>

<decisions>
## Implementation Decisions

### Control Layout
- Stacked vertically: camera style section above film effect section
- Subtle labels for section headers ("Kamerastil", "Filmeffekt") — small, muted
- Clear separation between the two sections (noticeable gap)
- Position below prompt display area — configure after seeing current prompt

### Selection Style
- Chips/pills for options — rounded pill-shaped buttons that wrap to multiple lines
- Selected state: filled background color; unselected: outline/ghost style
- Text only (no icons) — just the option name
- Auto-width chips — each chip sizes to fit its text naturally

### Default State
- Camera style pre-selects "Cinematic" on panel open
- Film effect pre-selects one default (e.g., "Weich")
- Allow deselect — clicking active chip deselects it (optional selection)
- Always show defaults when reopening — don't restore previous selections

### Generate Trigger
- Explicit "Video-Prompt erstellen" button (not auto-generate)
- Button positioned below configuration sections
- Loading state: button shows spinner while generating
- Button disabled during generation

### Claude's Discretion
- Exact spacing values and typography
- Which film effect to pre-select as default
- Button styling (primary/secondary variant)
- Error state handling if generation fails

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches matching existing app style.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-configuration-controls*
*Context gathered: 2026-01-25*
