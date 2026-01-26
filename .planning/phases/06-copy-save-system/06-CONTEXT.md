# Phase 6: Copy & Save System - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Clipboard copy functionality with visual feedback and automatic database persistence for generated prompts. Users can copy prompts to clipboard and prompts persist in database automatically. Variant management is Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Copy Feedback
- Toast position: bottom center (mobile-friendly, doesn't obscure panel)
- Toast duration: 2 seconds
- Success message: "Kopiert!" (short, clear German)
- Error handling: red error toast "Kopieren fehlgeschlagen" with brief explanation
- Button visual feedback: checkmark icon briefly (1-2s) then returns to copy icon

### Save Behavior
- Save timing: on generation (immediate when Gemini returns prompt — already implemented)
- Regeneration handling: overwrite existing prompt (variants come in Phase 7)
- Save failure: show prompt anyway + "Speichern fehlgeschlagen" with retry button
- No saved/unsaved indicator needed (auto-save on generation means always saved)

### Mobile Experience
- Haptic feedback: subtle vibration on successful copy
- Clipboard fallback: auto-select prompt text + toast "Text markiert - jetzt kopieren"
- Button position: below prompt text (natural flow: read, then copy)

### Claude's Discretion
- Exact toast styling (colors, icons) matching existing app patterns
- Retry button implementation details
- Haptic feedback duration/intensity

</decisions>

<specifics>
## Specific Ideas

- Copy button shows checkmark briefly after success — dual feedback (visual + toast)
- Fallback for older browsers selects text so user can manually copy

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-copy-save-system*
*Context gathered: 2026-01-25*
