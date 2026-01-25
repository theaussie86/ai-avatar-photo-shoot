# AI Avatar Photo Shoot

## What This Is

Eine App zum Erstellen von KI-generierten Avatar-Fotos mit Gemini AI, die jetzt um Video-Prompt-Generierung erweitert wird. Nutzer generieren Bilder, erstellen dann Video-Prompts für externe Tools wie Runway, Pika oder Kling — alles in einem Projekt organisiert.

## Core Value

Startbilder und Video-Prompts gehören zusammen. Ein Arbeitsbereich, in dem Avatar-Fotos entstehen und passende Video-Prompts für die Animation erstellt werden können.

## Requirements

### Validated

- ✓ Nutzer kann sich mit OAuth anmelden — existing
- ✓ Nutzer kann Gemini API-Key sicher speichern (verschlüsselt) — existing
- ✓ Nutzer kann Referenzbilder hochladen — existing
- ✓ Nutzer kann Bilder mit konfigurierbaren Einstellungen generieren (Shot-Typ, Seitenverhältnis, Prompt) — existing
- ✓ Nutzer kann Bilder in Collections organisieren — existing
- ✓ Nutzer kann generierte Bilder in Vollbild-Vorschau mit Karussell betrachten — existing
- ✓ Nutzer kann Bilder einzeln oder als Batch herunterladen — existing

### Active

- [ ] Nutzer kann Video-Prompt-Panel aus der Bildvorschau öffnen (Seitenpanel)
- [ ] System generiert Video-Prompt basierend auf Bild + Nutzeranweisungen via Gemini
- [ ] Nutzer kann Kamera-Stil auswählen (Cinematic, Slow Motion, Zoom-In, Orbit, Dolly, Statisch)
- [ ] Nutzer kann Film-Effekte auswählen (Dramatisch, Weich, Golden Hour, Noir, Verträumt)
- [ ] System zeigt KI-generierte Vorschläge basierend auf Bildanalyse
- [ ] System zeigt feste Vorschläge für häufige Aktionen (lächeln, winken, etc.)
- [ ] Nutzer kann mehrere Prompt-Varianten pro Bild erstellen
- [ ] Nutzer kann zwischen Varianten navigieren (1/2, 2/2, etc.)
- [ ] Nutzer kann Prompt verbessern (erstellt neue Variante)
- [ ] Nutzer kann Prompt in Zwischenablage kopieren
- [ ] Video-Prompts werden in Datenbank gespeichert (persistent mit Bild verknüpft)

### Out of Scope

- Video-Generierung in der App — Nutzer kopieren Prompts für externe Tools (Runway, Pika, Kling)
- Mehrsprachigkeit — App bleibt Deutsch-only (UI und generierte Prompts)
- Prompt-Templates/Presets — Varianten werden individuell pro Bild erstellt

## Context

**Bestehende Architektur:**
- Next.js 16 App Router mit Server Components und Server Actions
- Supabase für Auth, Datenbank, Storage
- Gemini AI für Bildgenerierung (bereits integriert)
- React Query für Client-State
- Radix UI / shadcn für Components

**Relevante bestehende Komponenten:**
- Bildvorschau-Modal mit Karussell (`components/collections/`)
- Gemini-Integration für Prompt-Verfeinerung (`lib/image-generation.ts`)
- Verschlüsselte API-Key-Verwaltung (`lib/encryption.ts`)

**UI-Referenz:**
- Mockups zeigen Seitenpanel-Design mit Prompt-Text, Varianten-Navigation, Konfigurations-Chips
- Panel öffnet sich über Video-Icon-Button rechts in der Bildvorschau

## Constraints

- **Tech Stack**: Next.js 16, Supabase, Gemini AI — keine neuen Major Dependencies
- **API**: Nutzt bestehende Gemini-Integration, kein separater API-Key für Video-Prompts
- **Sprache**: Alle UI-Texte und generierten Prompts auf Deutsch
- **Storage**: Video-Prompts in Supabase-Datenbank (neue Tabelle)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Seitenpanel statt Modal | Bild bleibt sichtbar während Prompt-Bearbeitung | — Pending |
| Varianten statt Überschreiben | Nutzer kann Prompt-Historie behalten und vergleichen | — Pending |
| Gemini für Prompt-Generierung | Bereits integriert, kann Bilder analysieren | — Pending |
| Deutsch-only | Zielgruppe deutschsprachig, vereinfacht Implementierung | — Pending |

---
*Last updated: 2025-01-25 after initialization*
