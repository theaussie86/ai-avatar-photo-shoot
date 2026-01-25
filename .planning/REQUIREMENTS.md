# Requirements: AI Avatar Photo Shoot - Video Prompt Generation

**Defined:** 2025-01-25
**Core Value:** Startbilder und Video-Prompts gehören zusammen in einem Arbeitsbereich

## v1 Requirements

### Panel UI

- [x] **PANEL-01**: Nutzer kann Video-Prompt-Panel aus Bildvorschau öffnen (Video-Icon-Button)
- [x] **PANEL-02**: Panel erscheint als Seitenpanel rechts neben dem Bild
- [x] **PANEL-03**: Panel zeigt generierten Prompt-Text (scrollbar)
- [x] **PANEL-04**: Panel kann geschlossen werden ohne Datenverlust

### Image Preview Verbesserungen

- [x] **PREV-01**: Bildvorschau-Komponente zeigt Bilder besser an (Layout/Sizing)
- [x] **PREV-02**: Bildvorschau hat saubere Integration für Video-Prompt-Panel
- [x] **PREV-03**: Responsive Layout passt sich an Panel-Zustand an (offen/geschlossen)

### Prompt-Generierung

- [x] **GEN-01**: System generiert Video-Prompt basierend auf Bild via Gemini
- [x] **GEN-02**: Nutzer kann Freitext-Anweisungen eingeben ("Was soll passieren")
- [x] **GEN-03**: Generierter Prompt berücksichtigt Bildinhalt, Anweisungen und Konfiguration
- [x] **GEN-04**: Generierte Prompts sind auf Englisch (geändert: Video-AI-Tools funktionieren besser mit Englisch)

### Konfiguration

- [x] **CONF-01**: Nutzer kann Kamera-Stil auswählen (Cinematic, Slow Motion, Zoom-In, Orbit, Dolly, Statisch)
- [x] **CONF-02**: Nutzer kann Film-Effekte auswählen (Dramatisch, Weich, Golden Hour, Noir, Verträumt)
- [x] **CONF-03**: Ausgewählte Optionen werden in Prompt-Generierung einbezogen

### Kopieren & Speichern

- [x] **SAVE-01**: Nutzer kann Prompt in Zwischenablage kopieren ("Kopieren"-Button)
- [x] **SAVE-02**: System zeigt Feedback nach erfolgreichem Kopieren (Toast)
- [x] **SAVE-03**: Video-Prompts werden automatisch in Datenbank gespeichert
- [x] **SAVE-04**: Prompts bleiben mit zugehörigem Bild verknüpft

### Varianten

- [ ] **VAR-01**: Nutzer kann mehrere Prompt-Varianten pro Bild erstellen
- [ ] **VAR-02**: Nutzer kann zwischen Varianten navigieren (1/2, 2/2, Pfeile)
- [ ] **VAR-03**: Nutzer kann neue Variante erstellen ("+Neu"-Button)
- [ ] **VAR-04**: Varianten-Anzahl wird im Panel-Header angezeigt (Badge)

### KI-Vorschläge

- [ ] **SUGG-01**: System zeigt KI-generierte Vorschläge basierend auf Bildanalyse
- [ ] **SUGG-02**: System zeigt feste Vorschläge für häufige Aktionen (lächeln, winken, etc.)
- [ ] **SUGG-03**: Nutzer kann Vorschlag auswählen (füllt Anweisungs-Feld)
- [ ] **SUGG-04**: Ausgewählte Vorschläge werden visuell markiert

### Feedback

- [ ] **FEED-01**: System zeigt Längen-Feedback für generierten Prompt (optimal: 50-150 Wörter)

## v2 Requirements

### Verbessern

- **IMP-01**: Nutzer kann bestehenden Prompt verbessern (erstellt neue Variante)
- **IMP-02**: System nutzt vorherigen Prompt als Kontext für Verbesserung

### Smart Defaults

- **DEF-01**: System wählt automatisch passende Kamera-Stile basierend auf Bildinhalt
- **DEF-02**: System wählt automatisch passende Effekte basierend auf Bildstimmung

## Out of Scope

| Feature | Reason |
|---------|--------|
| Video-Generierung in der App | Nutzer kopieren Prompts für externe Tools (Runway, Pika, Kling) |
| Plattform-spezifische Formatierung | Generische Prompts funktionieren überall, Optimierung später |
| Prompt-Templates/Presets-Bibliothek | Varianten werden individuell pro Bild erstellt |
| Community-Sharing von Prompts | Außerhalb Kern-Workflow |
| Mehrsprachigkeit | App bleibt Deutsch-only |
| Prompt-Bearbeitung (manuell) | Nutzer regeneriert mit anderen Anweisungen statt zu editieren |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PANEL-01 | Phase 4 | Complete |
| PANEL-02 | Phase 4 | Complete |
| PANEL-03 | Phase 4 | Complete |
| PANEL-04 | Phase 4 | Complete |
| PREV-01 | Phase 3 | Complete |
| PREV-02 | Phase 3 | Complete |
| PREV-03 | Phase 3 | Complete |
| GEN-01 | Phase 2 | Complete |
| GEN-02 | Phase 2 | Complete |
| GEN-03 | Phase 2 | Complete |
| GEN-04 | Phase 2 | Complete (adjusted to English) |
| CONF-01 | Phase 5 | Complete |
| CONF-02 | Phase 5 | Complete |
| CONF-03 | Phase 5 | Complete |
| SAVE-01 | Phase 6 | Complete |
| SAVE-02 | Phase 6 | Complete |
| SAVE-03 | Phase 1 | Complete |
| SAVE-04 | Phase 1 | Complete |
| VAR-01 | Phase 1 | Complete |
| VAR-02 | Phase 7 | Pending |
| VAR-03 | Phase 7 | Pending |
| VAR-04 | Phase 7 | Pending |
| SUGG-01 | Phase 8 | Pending |
| SUGG-02 | Phase 8 | Pending |
| SUGG-03 | Phase 8 | Pending |
| SUGG-04 | Phase 8 | Pending |
| FEED-01 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 (100% coverage)

---
*Requirements defined: 2025-01-25*
*Last updated: 2026-01-25 after roadmap creation*
