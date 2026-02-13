# Contributing to OxideDock

Thank you for your interest in contributing! This guide will help you get started.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Bun](https://bun.sh/) (v1.0+)
- [Tauri v2 system dependencies](https://v2.tauri.app/start/prerequisites/) for your OS

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/oxidedock.git
cd oxidedock
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

3. Commit with a descriptive message following [Conventional Commits](https://www.conventionalcommits.org/):

   ```
   feat: add new feature
   fix: resolve specific bug
   docs: update documentation
   chore: maintenance task
   ```

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
