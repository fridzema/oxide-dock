# Contributing to OxideDock

Thank you for your interest in contributing! This guide will help you get started.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Bun](https://bun.sh/) (v1.0+)
- [Tauri v2 system dependencies](https://v2.tauri.app/start/prerequisites/) for your OS

## Setup

```bash
git clone https://github.com/fridzema/oxide-dock.git
cd oxide-dock
make setup
```

## Development Workflow

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feature/your-feature
   ```

2. Make your changes and verify they work:

   ```bash
   make dev          # Test in the running app
   make ci           # Run the full CI pipeline locally
   ```

3. Commit with a descriptive message following [Conventional Commits](https://www.conventionalcommits.org/). Commitlint enforces this format automatically via a git hook.

   **Commit types:**

   | Type       | Description                                             |
   | ---------- | ------------------------------------------------------- |
   | `feat`     | A new feature                                           |
   | `fix`      | A bug fix                                               |
   | `docs`     | Documentation only changes                              |
   | `style`    | Formatting, missing semicolons, etc. (no logic)         |
   | `refactor` | Code change that neither fixes a bug nor adds a feature |
   | `perf`     | Performance improvement                                 |
   | `test`     | Adding or correcting tests                              |
   | `build`    | Changes to the build system or dependencies             |
   | `ci`       | Changes to CI configuration                             |
   | `chore`    | Other changes that don't modify src or test files       |
   | `revert`   | Reverts a previous commit                               |

   **Examples:**

   ```
   feat: add system tray support
   fix: resolve crash on window close
   docs: update installation instructions
   feat!: redesign plugin API
   ```

   Use `!` after the type or include a `BREAKING CHANGE:` footer for breaking changes.

4. Push and open a pull request against `main`.

## Code Style

- **TypeScript/Vue**: ESLint + Prettier handle formatting and linting. Run `make format` before committing.
- **Rust**: Clippy + Rustfmt. Run `make rust-format` and `make rust-lint`.
- Pre-commit hooks (via Lefthook) run automatically on commit.

## Testing

| Command          | Purpose              |
| ---------------- | -------------------- |
| `make test-unit` | Vitest unit tests    |
| `make test-e2e`  | Playwright e2e tests |
| `make rust-test` | Rust unit tests      |
| `make test`      | All of the above     |

## Project Structure

See the [README](README.md#project-structure) for an overview of the directory layout.

## Reporting Issues

Use GitHub Issues. Include:

- Steps to reproduce
- Expected vs actual behavior
- OS, Rust version, Bun version

## Release Process

Releases are fully automated via [release-please](https://github.com/googleapis/release-please):

1. **Conventional commits drive versioning** — commit types determine the version bump:
   - `fix:` → patch bump (0.1.0 → 0.1.1)
   - `feat:` → minor bump (0.1.0 → 0.2.0)
   - `feat!:` or `BREAKING CHANGE:` → major bump (0.1.0 → 1.0.0)
2. **Release PR** — when conventional commits land on `main`, release-please opens a PR that bumps version files (`package.json`, `Cargo.toml`, `tauri.conf.json`) and updates `CHANGELOG.md`.
3. **Tag and build** — merging the Release PR creates a git tag (e.g., `v0.2.0`), which triggers the release workflow to build cross-platform binaries and publish a GitHub release.

Check the current release status with `make release-status`.
