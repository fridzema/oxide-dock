# OxideDock Roadmap Design

**Date:** 2026-08-18
**Status:** Approved
**Scope:** Product direction, feature bets, and growth strategy for the next ~12 months

## Context

OxideDock is a Rust + Vue 3 + Tauri v2 desktop starter template. As of 2026-08-18:

- 96 stars, 12 forks, MIT, GitHub template repo, created 2026-02-13
- Traffic (trailing 14 days): 63 views / 21 unique, 67 clones / 31 unique
- Top referrer: reddit.com
- Discussions enabled (no content), security policy present, no funding links, no homepage URL
- Latest release: `oxidedock-v0.8.1` (2026-08-18)

### Current stack

Tauri v2, Vue 3.5, Vite 8, TypeScript 6, Tailwind 4, Pinia 4, Vue Router 5, Vitest 4,
Playwright, Biome + ESLint, Lefthook, commitlint, release-please, Dependabot, cargo-audit.

### Current surface

Three Rust commands (`greet`, `greet_checked`, `get_app_info`), four demo components,
a hand-written typed IPC layer at `src/shared/ipc.ts`, structured Rust errors via
`thiserror`, a 100% Rust line-coverage gate, cross-platform release builds
(`.deb`, `.AppImage`, `.dmg` Intel + ARM, `.msi`, `.exe`).

### Competitive landscape

| Template | Stars | Notes |
| --- | ---: | --- |
| `Uninen/tauri-vue-template` | 489 | Vue 3 + TS + Tailwind 4, AutoImport, basic Vitest, GH Actions, VS Code Rust debugging. Active (239 commits). |
| `yooneskh/vite-tauri-template` | 352 | Vite + Vuetify 3. No CI, no tests, no docs. Wins on age and Vuetify appeal. |
| `skymen/tauri-vue-template` | 105 | Small feature-preconfigured template. |
| `dannysmith/tauri-template` | 298 | React 19, batteries-included, tauri-specta bridge, updater wired, docs, AI-agent docs. Different framework, useful reference. |

### Core finding

OxideDock is already better engineered than every Vue competitor. It is not better known.
The bottleneck is **discovery and proof**, not features. OxideDock is absent from
`tauri-apps/awesome-tauri`, has no docs site, no published benchmarks, and a stale README.

## Decisions

1. **Vue-only.** No React or Svelte variants, no multi-framework scaffolding CLI.
   Goal is to be unambiguously the best Vue + Tauri starter.
2. **Stay a lean starter.** Core remains minimal. Growth comes from DX quality,
   documentation, and distribution.
3. **Two feature bets only:** a generated type-safe Rust↔TS bridge, and tested
   opt-in feature recipes.
4. **Blended phased sequencing:** quick wins → DX moat → coordinated launch → sustain.
5. **Auto-updater ships as a recipe, not a core default.** Consistent with staying lean.

## Positioning

> The Vue + Tauri starter that proves it works — every recipe, every platform,
> every release, verified in CI.

Competitors assert quality. OxideDock demonstrates it: the CI matrix is the marketing.

## Success metrics

| Metric | Baseline (2026-08-18) | 6 months | 12 months |
| --- | ---: | ---: | ---: |
| Stars | 96 | 400 | 800 (stretch) |
| Unique clones / 14d | 31 | 100 | 250 |
| Showcase entries | 1 | 5 | 12 |
| Outside contributors | 0 | 3 | 8 |

Tracked monthly. Diagnostic rule: if clones rise but stars do not, the README is the
problem; if traffic is flat, distribution is the problem.

## Phase 0 — Quick wins

Small, high-leverage, no architectural risk.

1. **Repo topics.** `desktop-` is a typo and wastes a slot. Correct it and add
   `desktop`, `vue3`, `tauri-v2`, `boilerplate`, `tailwindcss`, `pinia`, `bun`.
2. **README truth pass.** The tech table is stale in five places:
   Vite v7 → v8, TypeScript v5 → v6, Pinia v3 → v4, and "Oxlint + Prettier" → Biome
   (both in the feature list and the CI pipeline description).
3. **Fix `.vscode/`.** `settings.json` sets `editor.defaultFormatter` to
   `esbenp.prettier-vscode` and runs `source.fixAll.eslint`, but the project formats
   with Biome — format-on-save fights `make format-check`. Switch to `biomejs.biome`,
   drop the prettier and oxc recommendations from `extensions.json`, add `biomejs.biome`,
   and add a `launch.json` for Rust debugging.
4. **Submit a PR to `tauri-apps/awesome-tauri`.** Not currently listed. Highest-value
   single action available: permanent, free, targeted traffic.
5. **README media.** A ~10 second demo GIF (`make dev` → running app) and a star-history
   chart. The current static screenshot undersells a template whose pitch is speed.
6. **Set `homepageUrl`** — releases page initially, docs site after Phase 2.
7. **Seed Discussions.** Enabled but empty. Pin a "Show what you built" thread.

## Phase 1 — DX moat

### 1a. Generated type-safe bridge (`tauri-specta`)

Replace the hand-maintained command types in `src/shared/ipc.ts` with bindings generated
from Rust.

- Add `specta` and `tauri-specta` to `src-tauri/Cargo.toml`; annotate the command
  handlers; emit `src/shared/bindings.ts`.
- Keep the hand-written `formatError` / `isAppError` helpers — they handle plugin
  rejections that are not command results.
- Preserve the structured `AppError` shape (`code` + `message`) across the boundary.
- **CI gate:** regenerate bindings and run `git diff --exit-code`. Drift fails the build.

Claim unlocked: *your Rust and TypeScript cannot disagree — CI fails if they drift.*
No Vue + Tauri competitor offers this.

Risks: `tauri-specta` v2 API stability; interaction with the 100% Rust coverage gate
(generated/annotated code must not create uncoverable lines).

### 1b. Recipe system

Opt-in, scripted, tested feature additions that keep the core lean while making the
template feel batteries-included on demand.

Layout: `recipes/<name>/` containing an idempotent `apply.sh`, a `README.md`, and a
test fixture. Invoked as `make add-<name>`.

Initial recipes: `updater`, `window-state`, `tray`, `single-instance`, `deep-link`,
`sqlite`, `i18n`, `shadcn`.

**Insertion mechanism — marker-based, not regex rewriting.** Anchor comments
(`// oxide:plugins`, `// oxide:commands`) in `src-tauri/src/lib.rs` and `src/main.ts`;
recipes copy files and insert at markers. Regex-over-source is how "add feature" scripts
rot; markers make insertion deterministic and idempotent.

**CI matrix is the product.** Each recipe is applied to a clean checkout and then run
through `make ci`. Broken recipes are caught by CI, not reported by users. This is the
single strongest differentiator in the roadmap and the core of the positioning line.

`docs/recommended-plugins.md` collapses into per-recipe READMEs plus an index.

### 1c. AI-agent affordances

Ship `AGENTS.md`, `CLAUDE.md`, and `.cursor/rules` documenting architecture, available
commands, and conventions. Low cost, currently a live search term, and genuinely useful
given how projects are commonly started now.

### 1d. DX polish

Rust debugging config, documented Rust hot-reload workflow, and published CI timings.

## Phase 2 — Coordinated launch

- **VitePress docs site** on GitHub Pages: quick start, architecture, recipes,
  signing and distribution, comparison, FAQ.
- **CI-generated benchmarks**, dated and reproducible: binary size, cold start time,
  idle RSS, against an equivalent Electron app. Defensible numbers beat adjectives.
- **Comparison table** vs `Uninen`, `yooneskh`, and `create-tauri-app` — scrupulously
  fair, explicitly including where they win (Uninen's AutoImport, yooneskh's Vuetify).
  An unfair table gets dismantled in the launch thread and costs more than it gains.
- **Launch set, same week, docs site live first:** Show HN, r/rust, r/vuejs, r/tauri,
  a long-form dev.to article, Vue newsletters (Vue.js Feed, Weekly Vue News), an
  awesome-vue PR, and X/Bluesky. Reddit is already the top referrer — a proven channel
  rather than a guess.
- Time the launch to coincide with a release.

## Phase 3 — Sustain

- Dependabot auto-merge for patch bumps once CI is green.
- Monthly scheduled health run: fresh scaffold, every recipe, all platforms.
- Actively solicit "Built with OxideDock" showcase entries — social proof and backlinks.
- `good first issue` labeling; convert the existing 12 forkers into contributors.
- Regular changelog and release-note cadence tied to release-please.

## Non-goals

- No React or Svelte variants, and no multi-framework scaffolding CLI.
- No UI component library in the core (shadcn-vue is available as a recipe only).
- No mobile (iOS/Android) targets. Revisit only if issue traffic demands it.
- No auth, backend, or SaaS scaffolding.

## Implementation sequencing

This document is a roadmap, not a single implementation unit. Each phase is planned and
executed separately:

- **Phase 0** — one plan, mostly repo metadata and documentation edits. Independent of
  all later work; start here.
- **Phase 1a** (specta bridge) and **Phase 1b** (recipes) — separate plans. 1a touches
  `src/shared/ipc.ts`, the Rust handlers, and CI; 1b introduces `recipes/` and the marker
  comments. 1b should land after 1a so recipes insert against the final bridge shape.
- **Phase 1c/1d** — small, can ride along with either.
- **Phase 2** — planned once Phase 1 is merged, since the docs site and comparison table
  describe what actually shipped.
- **Phase 3** — ongoing operations, tracked as issues rather than a plan.
