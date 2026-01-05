---
description: Publish a new release (bump version, push, release on GitHub)
---

# Publish Release

This workflow automates the process of creating a new release.

1. Ensure your git working directory is clean.
// turbo
2. Check git status
   ```bash
   git status --porcelain
   ```
   If the output is not empty, please commit or stash your changes before proceeding.

3. Choose a release type (major, minor, or patch).
   Run one of the following commands:

   **For a Patch Release (0.0.x -> 0.0.x+1):**
   ```bash
   node scripts/release.js patch
   ```

   **For a Minor Release (0.x.0 -> 0.x+1.0):**
   ```bash
   node scripts/release.js minor
   ```

   **For a Major Release (x.0.0 -> x+1.0.0):**
   ```bash
   node scripts/release.js major
   ```
