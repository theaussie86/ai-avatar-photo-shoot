# Contributing Guide

## Versioning Workflow

We use [Semantic Versioning](https://semver.org/) for this project. The version is maintained in `package.json` and automatically reflected in the application header.

To update the version, use the `npm version` command:

```bash
# For a patch release (0.0.x -> 0.0.x+1) - Bug fixes
npm version patch

# For a minor release (0.x.0 -> 0.x+1.0) - New features (backwards compatible)
npm version minor

# For a major release (x.0.0 -> x+1.0.0) - Breaking changes
npm version major
```

This command will automatically:
1. Update the version in `package.json` and `package-lock.json`.
2. Create a git commit with the new version number.
3. Create a git tag for the release.

Please do not manually edit the version in `package.json`.
