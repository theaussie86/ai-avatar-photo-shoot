---
created: 2026-02-03T20:15
title: Persist background and custom prompt to local storage
area: ui
files:
  - components/avatar-creator/configuration-panel.tsx
---

## Problem

In the image configuration form, the background prompt and custom prompt fields are not persisted to local storage. Other settings (shot type, style, aspect ratio, etc.) are already saved there.

Current behavior:
- When user enters a custom background prompt or custom prompt, these values are lost on page reload
- If a user switches away from "custom background" option, the background prompt they typed is lost

Desired behavior:
- Save background prompt and custom prompt to local storage (even when not actively used)
- When "custom background" is not selected, hide the background prompt field but retain the value in local storage
- When user returns to the form or selects "custom background" again, restore the previously entered value
- Same pattern for custom prompt field — persist even when field is hidden/unused

## Solution

TBD - Extend existing local storage persistence logic to include:
- `backgroundPrompt` field
- `customPrompt` field

Ensure these are loaded on mount and saved on change, independent of whether the corresponding option is currently selected in the form.
