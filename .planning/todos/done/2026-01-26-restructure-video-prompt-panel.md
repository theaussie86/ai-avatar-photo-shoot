---
created: 2026-01-26T07:51
title: Restructure video prompt panel with variants and feedback
area: ui
files:
  - components/video-prompt/*
---

## Problem

The current video prompt panel layout needs restructuring to support:
1. **Variant navigation** - ability to switch between multiple prompt variants (< 1/1 > navigation shown in mockup)
2. **Prompt-first layout** - final generated prompt should appear at the top of the panel
3. **Feedback/instructions input** - textarea for user to describe what should happen in the video (e.g., "Die Person lächelt und winkt in die Kamera")
4. **Action buttons** - "Kopieren" (copy) and "+ Neu" (new variant) buttons below the prompt
5. **Suggestions section** - quick-select suggestions like "Kamera fährt sanft zurück, enthüllt Café-Szene"
6. **Config controls at bottom** - Camera style and film effect chips moved below the input area

Current layout has prompt display mixed with configuration. New layout separates viewing/copying generated prompts from creating new ones.

## Solution

TBD - This aligns with Phase 7 (Variants & Navigation) scope. Key changes:
- Add variant counter and prev/next navigation
- Reorganize panel sections: prompt display → actions → input → suggestions → config
- Add "+ Neu" button to create variant with current settings
- Support multiple prompts per image (variants model)
