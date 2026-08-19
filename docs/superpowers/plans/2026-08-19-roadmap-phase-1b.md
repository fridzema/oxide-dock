# Roadmap Phase 1b — Recipe System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship opt-in, scripted, CI-verified feature recipes so the core template stays lean while feeling batteries-included on demand.

**Architecture:** Anchor comments in `src-tauri/src/lib.rs` and `src/main.ts` give recipes deterministic insertion points. A shared TypeScript helper library performs marker insertion, `Cargo.toml` dependency edits, `package.json` dependency edits, and JSON permission merges into `src-tauri/capabilities/default.json`. Each recipe is a directory with an idempotent `apply.ts` and a README. `make add-<name>` runs one. CI applies every recipe to a clean checkout — fast checks on every PR, full builds nightly.

**Tech Stack:** Bun, TypeScript, Rust, Tauri v2, GitHub Actions.

Source spec: `docs/superpowers/specs/2026-08-18-roadmap-design.md`, section "1b. Recipe system".

---

## Verified facts

Confirmed against crates.io and the `tauri` crate metadata on 2026-08-19 — do not re-derive:

- `tauri-plugin-window-state` — stable **2.4.1**, 1.27M recent downloads
- `tauri-plugin-updater` — stable **2.10.1**, 3.81M recent downloads
- `tauri` exposes a **`tray-icon`** feature, and it is **not** in `default` (`default = ["wry", "compression", "common-controls-v6", "dynamic-acl", "x11", "dbus"]`). Loading a PNG tray icon also needs the **`image-png`** feature.
- Installed `tauri` is **2.11.5**

Unlike `tauri-specta` (rejected in Phase 1a for being permanently pre-release), all three of these are stable releases. No RC risk here.

## Scope decisions

- **Three recipes in the first cut:** `window-state`, `tray`, `updater`. Ordered simplest to hardest deliberately — `window-state` proves the mechanism with a one-line insertion, `tray` adds a setup block and a Cargo feature, `updater` adds config, capabilities, frontend code and signing. The remaining five from the spec (`single-instance`, `deep-link`, `sqlite`, `i18n`, `shadcn`) come later, once the shape is proven.
- **CI split:** every PR applies each recipe and runs lint + tests + `cargo check`; a nightly scheduled job runs the full `make ci` including the Tauri build for every recipe. Keeps PR feedback in minutes while still catching breakage within a day.

## Two deliberate deviations from the spec

1. **Recipes are `apply.ts` run by Bun, not `apply.sh`.** The spec said shell. Recipes must merge JSON (`capabilities/default.json`, `tauri.conf.json`, `package.json`) and do idempotent structured edits — shell plus `sed` is exactly the brittleness this system exists to avoid, and Bun is already a hard prerequisite.

2. **This plan specifies contracts rather than verbatim implementations** for the helper library and the three `apply.ts` files. The other plans in this directory give paste-ready code. Here the code depends on API surfaces that could not be fully verified without compiling against them — most of all the Tauri v2 tray API. Inventing plausible-looking code an implementer would paste unverified is worse than stating the contract precisely and requiring the implementer to verify against the docs and a real build. Every such step has a compile-or-run verification attached, so nothing lands unproven.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src-tauri/src/lib.rs` | Modify. Add `// oxide:plugins` and `// oxide:setup` anchors. |
| `src/main.ts` | Modify. Add `// oxide:frontend-init` anchor. |
| `recipes/_lib/apply.ts` | Create. Shared helpers: marker insertion, Cargo/package dependency edits, capability merge. All idempotent. |
| `recipes/README.md` | Create. Index of available recipes and how the system works. |
| `recipes/window-state/apply.ts` | Create. Simplest recipe — one dependency, one plugin line. |
| `recipes/window-state/README.md` | Create. What it does and what it changed. |
| `recipes/tray/apply.ts` | Create. Cargo features, setup-block code, tray menu. |
| `recipes/tray/README.md` | Create. |
| `recipes/updater/apply.ts` | Create. Rust + frontend deps, plugin, capability, `tauri.conf.json` config. |
| `recipes/updater/README.md` | Create. Includes signing key generation and CI secret setup. |
| `Makefile` | Modify. Add the `add-%` pattern target and help text. |
| `.github/workflows/recipes.yml` | Create. Per-PR fast matrix. |
| `.github/workflows/recipes-nightly.yml` | Create. Scheduled full-build matrix. |
| `docs/recommended-plugins.md` | Modify. Point the three now-scripted plugins at their recipes; keep the rest as prose. |

---

## Task 1: Anchors and the shared helper library

Nothing works until recipes have deterministic places to insert code. Marker-based insertion is the whole reason this system will not rot — regex-rewriting arbitrary Rust source is how "add feature" scripts die.

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/main.ts`
- Create: `recipes/_lib/apply.ts`
- Create: `recipes/README.md`
- Modify: `Makefile`

- [ ] **Step 1: Add the Rust anchors**

In `src-tauri/src/lib.rs`, the builder chain currently reads:

```rust
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .manage(state::AppState::default())
```

Add a `// oxide:plugins` anchor as the last line of the plugin run, immediately before `.manage(...)`:

```rust
        .plugin(tauri_plugin_os::init())
        // oxide:plugins
        .manage(state::AppState::default())
```

Then add a setup block with its own anchor, immediately after `.manage(...)`:

```rust
        .manage(state::AppState::default())
        .setup(|_app| {
            // oxide:setup
            Ok(())
        })
```

The empty setup block is deliberate: recipes that need app-level initialization (tray is the first) have nowhere to insert otherwise, and adding the block from a script would mean rewriting Rust structure rather than inserting a line.

- [ ] **Step 2: Verify the anchors compile**

Run: `cd src-tauri && cargo clippy -- -D warnings && cargo test`

Expected: clean, 18 tests pass. If clippy objects to the unused `_app` binding or the closure, fix it in the way clippy suggests and note what you changed.

- [ ] **Step 3: Add the frontend anchor**

In `src/main.ts`, immediately before `app.mount('#app')`, add:

```ts
// oxide:frontend-init
```

- [ ] **Step 4: Write the shared helper library**

Create `recipes/_lib/apply.ts`. Every helper must be **idempotent** — running a recipe twice must leave the file exactly as one run did, and must not throw.

Required exports:

- `insertAtMarker(filePath: string, marker: string, code: string): void` — inserts `code` on the line before `marker`, preserving the marker's indentation. Throws with a clear message naming the file and marker if the marker is absent. Returns without changing anything if `code` is already present in the file.
- `addCargoDependency(name: string, version: string): void` — adds to `[dependencies]` in `src-tauri/Cargo.toml` if absent. No-op if the crate is already listed.
- `addCargoFeatures(crate: string, features: string[]): void` — merges features into an existing dependency entry, preserving any already there.
- `addBunDependency(name: string, version: string): void` — adds to `dependencies` in `package.json` if absent, preserving key order and the file's two-space formatting.
- `addCapabilityPermissions(permissions: unknown[]): void` — merges entries into the `permissions` array of `src-tauri/capabilities/default.json`, skipping any already present. Must handle both plain string permissions and object-form permissions.
- `log(message: string): void` — consistent recipe output.

Write it in the project's Biome style (single quotes, no semicolons, trailing commas, 2-space indent, width 100).

- [ ] **Step 5: Add the Makefile target**

Add to `Makefile`:

```make
add-%:
	@test -d recipes/$* || { echo "Unknown recipe: $*. Available: $$(ls -d recipes/*/ | grep -v _lib | xargs -n1 basename | tr '\n' ' ')"; exit 1; }
	bun recipes/$*/apply.ts
```

Add `add-%` to the `.PHONY` line, and add a "Recipes" block to the `help` target listing the three recipes.

- [ ] **Step 6: Write the recipes index**

Create `recipes/README.md` covering: what recipes are, why the core stays lean, how to run one (`make add-<name>`), that they are idempotent, that each is verified in CI, and a table of the three available recipes with one-line descriptions. State plainly that recipes modify your checkout and are meant to be run once and committed.

- [ ] **Step 7: Verify**

Run: `bun run lint && bun run test:unit && make format-check && cd src-tauri && cargo clippy -- -D warnings`

Expected: all clean. Also run `make add-nonexistent` and confirm it fails with the "Unknown recipe" message rather than a confusing Make error.

- [ ] **Step 8: Commit**

```bash
git add src-tauri/src/lib.rs src/main.ts recipes/ Makefile
git commit -m "feat(recipes): add insertion anchors and shared apply helpers"
```

---

## Task 2: The window-state recipe

Simplest possible recipe. Its job is to prove the mechanism end to end before the harder ones build on it.

**Files:**
- Create: `recipes/window-state/apply.ts`
- Create: `recipes/window-state/README.md`

- [ ] **Step 1: Write the recipe**

`recipes/window-state/apply.ts` must:

1. `addCargoDependency('tauri-plugin-window-state', '2.4.1')`
2. `insertAtMarker` into `src-tauri/src/lib.rs` at `// oxide:plugins`:
   ```rust
   .plugin(tauri_plugin_window_state::Builder::new().build())
   ```
3. Log what it changed and point at `recipes/window-state/README.md`

No frontend code and no capability changes — the plugin works automatically.

- [ ] **Step 2: Run it**

Run: `make add-window-state`

Expected: reports the two changes. Then `git diff` should show exactly one line added to `Cargo.toml` and one to `lib.rs`.

- [ ] **Step 3: Verify it compiles and works**

Run: `cd src-tauri && cargo clippy -- -D warnings && cargo test`

Expected: clean, 18 tests pass.

- [ ] **Step 4: Verify idempotency**

Run `make add-window-state` a second time, then `git diff`.

Expected: the diff is identical to after the first run — no duplicated dependency, no duplicated plugin line, no error.

- [ ] **Step 5: Revert and confirm clean**

```bash
git checkout -- src-tauri/Cargo.toml src-tauri/src/lib.rs
git status --short
```

Expected: only the new untracked recipe files remain.

- [ ] **Step 6: Write the recipe README**

`recipes/window-state/README.md`: what the plugin does, the exact files it modifies, that no frontend code is needed, and a link to the plugin's upstream docs.

- [ ] **Step 7: Commit**

```bash
git add recipes/window-state
git commit -m "feat(recipes): add window-state recipe"
```

---

## Task 3: The tray recipe

First recipe that needs the setup anchor and a Cargo feature change.

**Files:**
- Create: `recipes/tray/apply.ts`
- Create: `recipes/tray/README.md`

- [ ] **Step 1: Write the recipe**

`recipes/tray/apply.ts` must:

1. `addCargoFeatures('tauri', ['tray-icon', 'image-png'])` — both are required and neither is in `default`
2. Insert tray setup code at the `// oxide:setup` marker in `src-tauri/src/lib.rs`, building a tray icon with a menu containing at least a "Quit" item wired to exit the app
3. Log what changed

**Verify the tray API against the current Tauri v2 docs before writing it** (https://v2.tauri.app/learn/system-tray/). The starting shape is `tauri::tray::TrayIconBuilder` plus `tauri::menu::{Menu, MenuItem}`, using `app.default_window_icon()` for the icon. If the current API differs from that shape, follow the docs and say so in your report — do not force the shape above.

Note the setup closure currently binds `_app`. Tray code needs the real binding, so the recipe must also rename `_app` to `app` when it inserts. Make that rename idempotent.

- [ ] **Step 2: Run and verify it compiles**

```bash
make add-tray
cd src-tauri && cargo clippy -- -D warnings && cargo test
```

Expected: clean, 18 tests pass. A compile error here means the API shape is wrong — fix against the docs, don't work around it.

- [ ] **Step 3: Verify it actually runs**

Run: `make dev`

Expected: the app launches and a tray icon appears in the system tray with a working Quit item. This is the one recipe whose success is not fully provable by compilation — confirm it visually and report what you saw.

- [ ] **Step 4: Verify idempotency**

Run `make add-tray` again, then `git diff`. Expected: unchanged from the first run, including the `_app` rename not being applied twice.

- [ ] **Step 5: Revert and confirm clean**

```bash
git checkout -- src-tauri/Cargo.toml src-tauri/src/lib.rs
git status --short
```

- [ ] **Step 6: Write the recipe README**

`recipes/tray/README.md`: what it adds, the Cargo features it enables and why they are not on by default, the files it modifies, and how to customize the menu.

- [ ] **Step 7: Commit**

```bash
git add recipes/tray
git commit -m "feat(recipes): add tray recipe"
```

---

## Task 4: The updater recipe

The hardest, and the one people actually need after shipping v1. It touches Rust deps, frontend deps, plugin registration, capabilities, `tauri.conf.json`, and requires signing keys the recipe cannot generate for the user.

**Files:**
- Create: `recipes/updater/apply.ts`
- Create: `recipes/updater/README.md`
- Modify: `docs/recommended-plugins.md`

- [ ] **Step 1: Write the recipe**

`recipes/updater/apply.ts` must:

1. `addCargoDependency('tauri-plugin-updater', '2.10.1')`
2. `addBunDependency('@tauri-apps/plugin-updater', '^2')`
3. Insert at `// oxide:plugins` in `src-tauri/src/lib.rs`:
   ```rust
   .plugin(tauri_plugin_updater::Builder::new().build())
   ```
4. `addCapabilityPermissions(['updater:default'])`
5. Add to `src-tauri/tauri.conf.json`: `bundle.createUpdaterArtifacts` set to `"v1Compatible"`, and a `plugins.updater` block with an `endpoints` array pointing at the GitHub releases `latest.json` for the current repository, and a `pubkey` field left as an empty string
6. Print a prominent completion notice: the recipe cannot generate signing keys, so the user must run `bun tauri signer generate`, put the public key in `tauri.conf.json`, and add the private key to CI secrets — with a pointer to the recipe README

The empty `pubkey` is deliberate and must be called out loudly. A recipe that silently leaves a non-functional updater is worse than one that tells you what is left to do.

- [ ] **Step 2: Run and verify**

```bash
make add-updater
bun install
cd src-tauri && cargo clippy -- -D warnings && cargo test
```

Expected: clean, 18 tests pass.

- [ ] **Step 3: Verify the config is valid**

Confirm `src-tauri/tauri.conf.json` still parses as strict JSON and that `src-tauri/capabilities/default.json` now contains `updater:default` exactly once.

- [ ] **Step 4: Verify idempotency**

Run `make add-updater` again, then `git diff`. Expected: unchanged — no duplicate permission entry, no duplicate endpoint, no duplicate dependency.

- [ ] **Step 5: Revert and confirm clean**

```bash
git checkout -- src-tauri/Cargo.toml src-tauri/tauri.conf.json src-tauri/capabilities/default.json src-tauri/src/lib.rs package.json
git status --short
```

Note: `bun install` may have modified `bun.lock`. Revert that too if so.

- [ ] **Step 6: Write the recipe README**

`recipes/updater/README.md` is the most important recipe README, because the recipe deliberately leaves work undone. It must cover: generating a keypair with `bun tauri signer generate -w ~/.tauri/<app>.key`, where the public key goes, adding `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` to GitHub Actions secrets, how the release workflow produces `latest.json`, and a minimal frontend snippet calling `check()` and `downloadAndInstall()`.

- [ ] **Step 7: Fold the prose docs into the recipes**

In `docs/recommended-plugins.md`, replace the hand-written `tauri-plugin-window-state` and `tauri-plugin-updater` sections with short pointers to `make add-window-state` and `make add-updater` and their recipe READMEs. Leave any other plugin sections as prose.

- [ ] **Step 8: Verify and commit**

```bash
bun run lint && bun run test:unit && make format-check
git add recipes/updater docs/recommended-plugins.md
git commit -m "feat(recipes): add updater recipe"
```

---

## Task 5: CI verification

This is the part no competitor has, and the reason the positioning line says "verified in CI". A recipe that silently rots is worse than no recipe.

**Files:**
- Create: `.github/workflows/recipes.yml`
- Create: `.github/workflows/recipes-nightly.yml`

- [ ] **Step 1: Write the per-PR workflow**

`.github/workflows/recipes.yml`, triggered on `push` to `main` and on `pull_request`:

- A matrix over `[window-state, tray, updater]`
- Each leg: checkout, `./.github/actions/setup-bun`, `./.github/actions/setup-tauri`, `bun install`, `make add-<recipe>`, then `bun run lint`, `bun run test:unit`, and `cd src-tauri && cargo clippy -- -D warnings && cargo test`
- A second run of `make add-<recipe>` followed by `git diff --exit-code`, proving idempotency in CI rather than only on a developer's machine
- `fail-fast: false` so one broken recipe does not mask the others
- `timeout-minutes: 15`
- Reuse the existing composite actions in `.github/actions/` rather than duplicating setup steps

Deliberately **no** `bun tauri build` here — that is what makes this fast enough for every PR.

- [ ] **Step 2: Write the nightly workflow**

`.github/workflows/recipes-nightly.yml`, triggered on `schedule` (daily) and `workflow_dispatch`:

- Same matrix, same apply step
- Runs the full `make ci`, including the Tauri build
- `timeout-minutes: 45`
- `fail-fast: false`

- [ ] **Step 3: Validate the workflow files**

Confirm both files are valid YAML and that the action references resolve:

```bash
python3 -c "import yaml,sys; [yaml.safe_load(open(f)) for f in ['.github/workflows/recipes.yml','.github/workflows/recipes-nightly.yml']]; print('valid')"
ls .github/actions/
```

- [ ] **Step 4: Dry-run one matrix leg locally**

Simulate what CI does for the simplest recipe, in a scratch clone so the working tree is untouched:

```bash
TMP=$(mktemp -d)
git clone --depth 1 file://$(pwd) "$TMP/probe"
cd "$TMP/probe" && bun install && make add-window-state && bun run lint && bun run test:unit
make add-window-state && git diff --exit-code && echo "IDEMPOTENT"
```

Expected: all pass and `IDEMPOTENT` prints. Report the actual output. Clean up `$TMP` afterwards.

- [ ] **Step 5: Update the README**

Add a `## Recipes` section to `README.md` before `## CI/CD`: what recipes are, the three available with `make add-<name>`, and the fact that every recipe is applied to a clean checkout and verified in CI on every PR, with full cross-platform builds nightly. Scope the claim to what CI actually does — per-PR runs do not build the app.

Then run `bunx vitest run readme-versions` to confirm the README guards still pass.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/recipes.yml .github/workflows/recipes-nightly.yml README.md
git commit -m "ci(recipes): verify every recipe on PRs and build them nightly"
```

**Note:** pushing `.github/workflows` changes requires the SSH remote — the HTTPS origin's token lacks the `workflow` scope. Push with `git push git@github.com:fridzema/oxide-dock.git <branch>` or reconfigure the remote first.

---

## Done criteria

- [ ] `make add-window-state`, `make add-tray`, `make add-updater` all work from a clean checkout
- [ ] Every recipe is idempotent, proven by a second run producing no diff
- [ ] Every recipe compiles and passes `cargo clippy -- -D warnings` and `cargo test`
- [ ] The tray recipe was visually confirmed to produce a working tray icon
- [ ] `make add-nonexistent` fails with a helpful message
- [ ] Both workflows are valid and the local dry-run of one matrix leg passes
- [ ] Working tree is clean — no recipe output committed to the template itself
- [ ] `bun run lint && bun run test:unit && make format-check` clean

## Explicitly out of scope

- The other five recipes from the spec: `single-instance`, `deep-link`, `sqlite`, `i18n`, `shadcn`. Add once this shape is proven.
- Generating signing keys on the user's behalf. The updater recipe deliberately stops short and says so.
- Recipe removal or rollback. `git checkout` is the supported undo.
