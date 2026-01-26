# Phase 8: AI Suggestions & Quality Feedback - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Help users create better video prompts through action suggestions and length guidance. Users can select from AI-generated and fixed action suggestions that populate an instruction field, and see word count feedback on generated prompts. The suggestions influence what Gemini generates.

</domain>

<decisions>
## Implementation Decisions

### Suggestions UI
- Chip-based display (consistent with config controls)
- Positioned before config controls (at top of panel content)
- Wrap to multiple rows (all suggestions visible)
- 3-5 AI-generated suggestions per image

### AI vs Fixed Suggestions
- Subtle styling distinction: sparkle icon on AI-generated chips
- Fixed suggestions appear first, AI suggestions follow
- German labels for fixed suggestions: lächeln, winken, nicken, drehen
- AI-generated suggestions also in German (consistent UI language)

### Instruction Input
- Free text textarea where users can type or receive suggestions
- Clicking suggestion appends to existing text
- Multiple suggestions separated by comma + space
- Clicked suggestions show highlighted/active state

### Length Feedback
- Word count displayed below prompt text
- Colored text only (no progress bar or icons)
- 50-150 words: green (optimal)
- 151-200 words: yellow (warning)
- >200 words: red (too long)
- No minimum length warning

### Claude's Discretion
- Exact chip styling and spacing
- Sparkle icon implementation (emoji vs SVG)
- Textarea placeholder text
- How to detect which suggestions are currently in the text field

</decisions>

<specifics>
## Specific Ideas

- Fixed suggestions should match the ROADMAP requirements: lächeln, winken, nicken, drehen
- AI suggestions should be contextual to the image content (e.g., "Make character look at camera" if they're looking away)
- Word count thresholds based on Phase 2 decision about 50-150 word optimal range for video AI tools

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-ai-suggestions-quality-feedback*
*Context gathered: 2026-01-26*
