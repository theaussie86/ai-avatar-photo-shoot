# AI Avatar Photo Shoot

## What This Is

Eine App zum Erstellen von KI-generierten Avatar-Fotos mit Gemini AI, jetzt mit Video-Prompt-Generierung. Nutzer generieren Bilder, erstellen dann Video-Prompts für externe Tools wie Runway, Pika oder Kling — alles in einem Projekt organisiert.

## Core Value

Startbilder und Video-Prompts gehören zusammen. Ein Arbeitsbereich, in dem Avatar-Fotos entstehen und passende Video-Prompts für die Animation erstellt werden können.

## Requirements

### Validated

**v1.0 Video Prompt Generation (shipped 2026-01-26):**

- ✓ Nutzer kann sich mit OAuth anmelden — existing
- ✓ Nutzer kann Gemini API-Key sicher speichern (verschlüsselt) — existing
- ✓ Nutzer kann Referenzbilder hochladen — existing
- ✓ Nutzer kann Bilder mit konfigurierbaren Einstellungen generieren — existing
- ✓ Nutzer kann Bilder in Collections organisieren — existing
- ✓ Nutzer kann generierte Bilder in Vollbild-Vorschau mit Karussell betrachten — existing
- ✓ Nutzer kann Bilder einzeln oder als Batch herunterladen — existing
- ✓ Nutzer kann Video-Prompt-Panel aus der Bildvorschau öffnen — v1.0
- ✓ System generiert Video-Prompt basierend auf Bild + Nutzeranweisungen via Gemini — v1.0
- ✓ Nutzer kann Kamera-Stil auswählen (Cinematic, Slow Motion, Zoom-In, Orbit, Dolly, Statisch) — v1.0
- ✓ Nutzer kann Film-Effekte auswählen (Dramatisch, Weich, Golden Hour, Noir, Verträumt) — v1.0
- ✓ System zeigt KI-generierte Vorschläge basierend auf Bildanalyse — v1.0
- ✓ System zeigt feste Vorschläge für häufige Aktionen (lächeln, winken, etc.) — v1.0
- ✓ Nutzer kann mehrere Prompt-Varianten pro Bild erstellen — v1.0
- ✓ Nutzer kann zwischen Varianten navigieren (1/2, 2/2, etc.) — v1.0
- ✓ Nutzer kann Prompt in Zwischenablage kopieren — v1.0
- ✓ Video-Prompts werden in Datenbank gespeichert (persistent mit Bild verknüpft) — v1.0
- ✓ System zeigt Längen-Feedback für generierten Prompt — v1.0

### Active

(None — next milestone requirements to be defined via `/gsd:new-milestone`)

### Out of Scope

- Video-Generierung in der App — Nutzer kopieren Prompts für externe Tools (Runway, Pika, Kling)
- Mehrsprachigkeit — App bleibt Deutsch-only (UI), English prompts for video AI tools
- Prompt-Templates/Presets — Varianten werden individuell pro Bild erstellt
- Plattform-spezifische Formatierung — Generische Prompts funktionieren überall

## Context

**Current State (v1.0 shipped):**
- ~8,700 lines of TypeScript/SQL added for video prompt feature
- Tech stack: Next.js 16, React 19, Supabase, Gemini AI
- 65 files modified across app/actions, components, hooks, lib
- Full React Query integration with 30s stale time
- Responsive panel architecture (Sheet desktop, Drawer mobile)

**Architecture Highlights:**
- `app/actions/video-prompt-actions.ts` — Server actions for prompt generation and AI suggestions
- `components/avatar-creator/VideoPromptPanel.tsx` — Panel content with 4-state rendering
- `hooks/use-video-prompts.ts`, `use-ai-suggestions.ts` — React Query hooks
- `lib/video-prompts.ts` — Constants and system prompt for Gemini
- `supabase/migrations/` — video_prompts table with RLS

**User Feedback (to gather):**
- Does English prompt output work well with Runway/Pika/Kling?
- Are 50-150 word prompts optimal?
- Do users want to improve existing prompts vs create new variants?

## Constraints

- **Tech Stack**: Next.js 16, Supabase, Gemini AI — keine neuen Major Dependencies
- **API**: Nutzt bestehende Gemini-Integration, kein separater API-Key für Video-Prompts
- **Sprache**: UI auf Deutsch, Video-Prompts auf Englisch (für video AI tool compatibility)
- **Storage**: Video-Prompts in Supabase-Datenbank (video_prompts table)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Seitenpanel statt Modal | Bild bleibt sichtbar während Prompt-Bearbeitung | ✓ Good |
| Varianten statt Überschreiben | Nutzer kann Prompt-Historie behalten und vergleichen | ✓ Good |
| Gemini für Prompt-Generierung | Bereits integriert, kann Bilder analysieren | ✓ Good |
| English video prompts | Runway/Pika/Kling work better with English | ✓ Good |
| 30s React Query staleTime | Prompts don't change often, reduces refetching | ✓ Good |
| Clipboard API + execCommand fallback | Browser compatibility across devices | ✓ Good |
| Non-blocking AI suggestions | Enhancement not core; graceful degradation on error | ✓ Good |
| Composite state pattern | Avoids React 19 useEffect setState lint errors | ✓ Good |

---
*Last updated: 2026-01-26 after v1.0 milestone*
