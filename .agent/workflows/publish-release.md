---
description: Publish a new release (bump version, push, release on GitHub)
---

# Publish Release

This workflow automates the process of creating a new release.

1. **Create a new branch** for your release (e.g., `release/vX.Y.Z`).
   ```bash
   git checkout -b release/params
   ```

2. **Run the release script.**
   This will bump the version in `package.json` and create a commit.

   **For a Patch Release (0.0.x -> 0.0.x+1):**
   ```bash
   npm run release patch
   ```

   **For a Minor Release (0.x.0 -> 0.x+1.0):**
   ```bash
   npm run release minor
   ```

   **For a Major Release (x.0.0 -> x+1.0.0):**
   ```bash
   npm run release major
   ```

3. **Push the branch and open a Pull Request.**
   ```bash
   git push -u origin HEAD
   ```

4. **Merge the Pull Request into `main`.**
   Once merged, the GitHub Action will automatically create the `vX.Y.Z` tag and a GitHub Release.
