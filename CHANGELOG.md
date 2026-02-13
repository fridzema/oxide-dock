# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0](https://github.com/fridzema/oxide-dock/compare/oxidedock-v0.1.0...oxidedock-v0.2.0) (2026-02-13)

### Features

- 100% test coverage for Rust and Vue/TS ([8b4c5bf](https://github.com/fridzema/oxide-dock/commit/8b4c5bfb161145c73f956e359fc05a811a897ae8))
- 100% test coverage for Rust and Vue/TS ([ba9aa04](https://github.com/fridzema/oxide-dock/commit/ba9aa04496cb087ff58352a9acb250eac7509d88))

### Bug Fixes

- update release-please workflow to keep Cargo.lock in sync ([3d33fb6](https://github.com/fridzema/oxide-dock/commit/3d33fb62154f16769733ef34b803c693d0ee2f55))

## [Unreleased]

### Fixed

- Bundle identifier changed from `.app` to `.desktop` to avoid macOS conflicts
- Correct GitHub repo URL in SystemInfoDemo component
- Vue Router version (v4 → v5) and branding doc path in README
- Remove placeholder `authors` and unused `serde_json` from Cargo.toml
- Window minimum size constraints (600x400) to prevent layout breakage
- Default Content Security Policy for production security
- Rust error handling — `run()` returns Result, no more panics
- Accessibility: input labels, status roles, counter button aria-labels
- CI formatting gate no longer broken

### Added

- 404 catch-all route with NotFound page
- Global Vue error handler and unhandled promise rejection listener
- `greet_checked` Rust command demonstrating `Result<T, E>` pattern
- Theme-color meta tags for light/dark system theming
- E2E tests in CI pipeline
- Coverage thresholds enforcement
- Rust release profile optimizations (LTO, single codegen unit, strip)

### Removed

- Dead `HelloWorld.vue` component (was test-only)
- Empty `src/assets/` directory

### Changed

- CI: split fast checks (PRs) from full builds (main only)
- `make rust-audit` now checks for cargo-audit before running
