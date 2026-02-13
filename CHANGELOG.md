# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1](https://github.com/fridzema/oxide-dock/compare/oxidedock-v0.3.0...oxidedock-v0.3.1) (2026-02-13)


### Bug Fixes

* align Makefile coverage regex with CI ([5d711f8](https://github.com/fridzema/oxide-dock/commit/5d711f81d8e9c759af79a9397870969b262b71f1))
* only install Apple Rust targets on macOS release runners ([0aaa664](https://github.com/fridzema/oxide-dock/commit/0aaa66479925b014be343bdf96547561bf7bac83))
* use dynamic branch name from release-please output ([02e29e1](https://github.com/fridzema/oxide-dock/commit/02e29e1ee301d974f7e2c2b07f0d41255341ba4f))

## [0.3.0](https://github.com/fridzema/oxide-dock/compare/oxidedock-v0.2.0...oxidedock-v0.3.0) (2026-02-13)

### Features

- **backend:** app error type + consistent command results ([12b0d03](https://github.com/fridzema/oxide-dock/commit/12b0d0310de5a7be81c640eda0bf8d96ffd1f6e6))
- **ipc:** add typed invoke wrappers + shared types ([882220b](https://github.com/fridzema/oxide-dock/commit/882220b2f55520a00b00baf40fd8e71c9f62c092))
- **logging:** tauri-plugin-log setup + frontend log forwarding ([74c8978](https://github.com/fridzema/oxide-dock/commit/74c89780f6c0b040dade56c21e113e9a7befc553))
- production hardening & infrastructure ([448a898](https://github.com/fridzema/oxide-dock/commit/448a8982f8c9eeea081ba0101d22d1b3c1d6d0d2))
- **sample:** open-file -&gt; read-text -&gt; display (safe path flow) ([f50b1fe](https://github.com/fridzema/oxide-dock/commit/f50b1fe29f1de9bbec3efac549a77df7aa337628))
- **state:** managed AppState + async command example ([8e3f8e1](https://github.com/fridzema/oxide-dock/commit/8e3f8e14c09065edd0608682c0302612e3550eed))

### Bug Fixes

- harden bootstrap.sh against special characters in user input ([37e4f37](https://github.com/fridzema/oxide-dock/commit/37e4f3715d7cb6716e6a39329ca5cbf554cf322b))
- pin Node and Bun versions in devcontainer config ([9f5c01f](https://github.com/fridzema/oxide-dock/commit/9f5c01f08b5d74645ba477e6dba5fb02148129d8))
- **security:** tighten default capabilities & document escalation path ([0f7c285](https://github.com/fridzema/oxide-dock/commit/0f7c28545590c756433d01ca792e18c0cf0038d4))
- standardize repo URLs to fridzema/oxide-dock ([7c25791](https://github.com/fridzema/oxide-dock/commit/7c257917fcd5740277357be48ae30f7db2d3972d))

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
