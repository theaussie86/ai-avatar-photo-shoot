# Publish Release

Automate the process of creating a new release.

## Arguments

- `$ARGUMENTS` - Release type: `patch`, `minor`, or `major` (required)

## Steps

1. **Validate the release type** - Ensure the argument is one of: `patch`, `minor`, `major`. If not provided or invalid, ask the user which type they want.

2. **Check git status** - Ensure the working directory is clean. If there are uncommitted changes, warn the user and ask how to proceed.

3. **Ensure we're on a feature branch**:
   - If on `main`: create and checkout a new branch `release/v<new-version>`
   - If on another branch: stay on it

4. **Run the release script** to bump the version:
   ```bash
   npm run release $ARGUMENTS
   ```

5. **Push the branch** and set upstream:
   ```bash
   git push -u origin HEAD
   ```

6. **Get or create Pull Request**:
   - Check if a PR already exists for the current branch: `gh pr view --json url`
   - If a PR exists: use it and report the URL
   - If no PR exists: create one with `gh pr create --title "Release v<new-version>" --body "Release v<new-version>"`

7. **Inform the user** that the PR is ready for review. Once merged, the GitHub Action will automatically create the tag and GitHub Release.
