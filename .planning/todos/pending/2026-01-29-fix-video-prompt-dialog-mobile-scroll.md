---
created: 2026-01-29T19:35
title: Fix video prompt dialog not scrollable on mobile
area: ui
files:
  - components/avatar-creator/VideoPromptPanel.tsx
  - components/avatar-creator/VideoPromptConfig.tsx
  - components/avatar-creator/VideoPromptButton.tsx
---

## Problem

On mobile devices, the video prompt generator dialog content overflows the viewport. Users cannot scroll down to reach the configuration options or the submit button, making the feature unusable on mobile. The dialog appears to lack proper overflow scrolling, so the bottom portion (buttons, config options) is cut off and inaccessible.

Screenshot shows the dialog taking full height with prompt text visible but action buttons ("Kopieren", "+ Neu") and action suggestions ("lacheln", "winken", "nicken", "drehen") partially or fully cut off at the bottom edge.

## Solution

TBD — likely needs `overflow-y: auto` or `overflow-y: scroll` on the dialog content container, plus a `max-h-[dvh]` constraint to respect mobile viewport. May also need to ensure the dialog uses `DialogContent` with proper scroll handling from the UI library.
