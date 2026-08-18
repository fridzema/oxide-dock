# Roadmap Phase 1a — IPC Drift Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make it impossible for OxideDock's Rust command surface and its TypeScript IPC layer to drift apart, without adding a dependency.

**Architecture:** A single Vitest test parses three sources of truth and asserts they describe the same set of commands: `tauri::generate_handler![...]` in `src-tauri/src/lib.rs` (registered), `#[tauri::command]` functions in `src-tauri/src/handlers.rs` (defined), and the `CommandResults` keys in `src/shared/ipc.ts` (declared in TypeScript). Same technique as the README drift guard shipped in Phase 0. Then the README documents the guarantee, scoped honestly to what the test actually proves.

**Tech Stack:** Bun, Vitest 4, Biome 2.

Source spec: `docs/superpowers/specs/2026-08-18-roadmap-design.md`, section "Phase 1 — DX moat", subsection "1a. IPC drift guard (no new dependency)".

---

## Background: why not tauri-specta

`tauri-specta` would generate TypeScript bindings from Rust and give stronger guarantees, including payload field types. It was evaluated on 2026-08-18 and rejected for now: it has no stable v2 (latest `2.0.0-rc.25`, published 2026-05-08; `max_stable` is `1.0.2`, the Tauri v1 line), and it has been in release candidate for over two years. It is actively maintained and heavily used, so this is not a quality judgment — but a template selling "production-ready defaults" should not put a pre-release crate in every user's IPC layer. Revisit when a stable 2.0 ships.

Consequence: this plan guards the command **surface**, not payload field types. Every public claim must be scoped to that.

---

## Current state

`src-tauri/src/lib.rs` registers three commands:

```rust
.invoke_handler(tauri::generate_handler![
    handlers::greet,
    handlers::greet_checked,
    handlers::get_app_info
])
```

`src-tauri/src/handlers.rs` defines three `#[tauri::command]` functions: `greet`, `greet_checked`, `get_app_info`. Note that `get_app_info` carries a second attribute (`#[allow(clippy::needless_pass_by_value)]`) between `#[tauri::command]` and its `pub fn` line — the parser must tolerate intervening attributes.

`src/shared/ipc.ts` declares:

```ts
export type CommandResults = {
  greet: string
  greet_checked: string
  get_app_info: AppInfo
}
```

All three are currently in sync, so the new test passes the moment it is written. That makes a deliberate-drift experiment mandatory — otherwise there is no evidence the test can fail.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `tests/unit/ipc-surface.test.ts` | Create. Parses the three sources and asserts the command sets match. |
| `README.md` | Modify. Document the guarantee and its limit. |

Coverage is unaffected: `vitest.config.ts` scopes coverage `include` to `src/**`, and this test asserts against source text rather than importing `src` modules.

---

## Task 1: The drift guard test

**Files:**
- Create: `tests/unit/ipc-surface.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/unit/ipc-surface.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

function read(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

// Commands wired into the Tauri runtime via tauri::generate_handler!.
function registeredCommands(): string[] {
  const source = read('src-tauri/src/lib.rs')
  const block = source.match(/generate_handler!\[([^\]]*)\]/)
  if (!block) throw new Error('src-tauri/src/lib.rs has no generate_handler! invocation')
  return block[1]
    .split(',')
    .map((entry) => entry.trim().replace(/^.*::/, ''))
    .filter((entry) => entry.length > 0)
    .sort()
}

// Functions annotated #[tauri::command]. Tolerates further attributes before the fn.
function definedCommands(): string[] {
  const source = read('src-tauri/src/handlers.rs')
  const chunks = source.split('#[tauri::command]').slice(1)
  if (chunks.length === 0) {
    throw new Error('src-tauri/src/handlers.rs has no #[tauri::command] functions')
  }
  return chunks
    .map((chunk) => {
      const fn = chunk.match(/pub\s+(?:async\s+)?fn\s+(\w+)/)
      if (!fn) throw new Error('a #[tauri::command] attribute is not followed by a pub fn')
      return fn[1]
    })
    .sort()
}

// Keys of the CommandResults map, which is the TypeScript view of the command surface.
function declaredCommands(): string[] {
  const source = read('src/shared/ipc.ts')
  const block = source.match(/export type CommandResults = \{([^}]*)\}/)
  if (!block) throw new Error('src/shared/ipc.ts has no CommandResults type')
  return block[1]
    .split('\n')
    .map((line) => line.match(/^\s*(\w+)\s*:/)?.[1])
    .filter((name): name is string => name !== undefined)
    .sort()
}

describe('Tauri command surface', () => {
  it('finds commands in all three sources', () => {
    expect(registeredCommands().length).toBeGreaterThan(0)
    expect(definedCommands().length).toBeGreaterThan(0)
    expect(declaredCommands().length).toBeGreaterThan(0)
  })

  it('registers exactly the commands handlers.rs defines', () => {
    expect(registeredCommands()).toEqual(definedCommands())
  })

  it('declares in TypeScript exactly the commands Rust registers', () => {
    expect(declaredCommands()).toEqual(registeredCommands())
  })
})
```

- [ ] **Step 2: Run the test**

Run: `bunx vitest run ipc-surface`

Expected: PASS, 3 tests. The three sources are currently in sync, so this is expected — Step 3 is what proves the test is not vacuous.

- [ ] **Step 3: Prove the test catches real drift**

Run three experiments. After each, revert with `git checkout -- <file>` and confirm the test passes again before starting the next. Record the actual failure message from each.

**Experiment A — command defined but not registered** (the classic Tauri footgun).
Add to the end of `src-tauri/src/handlers.rs`:

```rust
#[tauri::command]
pub fn drift_probe() -> String {
    String::from("probe")
}
```

Run `bunx vitest run ipc-surface`. Expected: the "registers exactly the commands handlers.rs defines" test fails, showing `drift_probe` present in defined but absent from registered.

**Experiment B — command registered and defined, but missing from TypeScript.**
Keep the `drift_probe` handler from Experiment A and also add `handlers::drift_probe` to the `generate_handler!` list in `src-tauri/src/lib.rs`.

Run `bunx vitest run ipc-surface`. Expected: "registers exactly the commands handlers.rs defines" now passes, and "declares in TypeScript exactly the commands Rust registers" fails, showing `drift_probe` missing from the TypeScript side.

**Experiment C — TypeScript declares a command Rust does not have.**
Revert both Rust files. Add `drift_probe: string` to the `CommandResults` type in `src/shared/ipc.ts`.

Run `bunx vitest run ipc-surface`. Expected: "declares in TypeScript exactly the commands Rust registers" fails, showing an extra `drift_probe` on the TypeScript side.

Revert. Confirm `git status --short` is clean and `bunx vitest run ipc-surface` passes 3 tests.

Do NOT commit any experiment code.

- [ ] **Step 4: Verify the whole suite**

Run: `bun run lint && bun run test:unit && make format-check`

Expected: lint clean, 16 test files / 103 tests passing, format-check clean.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/ipc-surface.test.ts
git commit -m "test: guard the Tauri command surface against drift"
```

---

## Task 2: Document the guarantee

The test is only worth what people know about it. Document it, and state the limit plainly — an overclaim here is the kind of thing that gets picked apart when the project is posted publicly in Phase 2.

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a feature bullet**

In the `## Features` list in `README.md`, directly after the `- **TypeScript** — type-safe frontend and configuration` line, add:

```markdown
- **Guarded IPC** — a test fails the build if Rust commands and the TypeScript layer drift apart
```

- [ ] **Step 2: Add an explanatory section**

Immediately before the `## CI/CD` heading in `README.md`, insert:

```markdown
## Type-Safe IPC

Commands cross the Rust/TypeScript boundary through `src/shared/ipc.ts`, which gives every
command a typed wrapper and turns Rust's structured `AppError` into a predictable shape on
the frontend.

Three places have to agree for a command to work: it must be defined with
`#[tauri::command]` in `src-tauri/src/handlers.rs`, registered in `tauri::generate_handler!`
in `src-tauri/src/lib.rs`, and declared in `CommandResults` in `src/shared/ipc.ts`. Miss one
and the failure shows up at runtime, usually as a confusing "command not found".

`tests/unit/ipc-surface.test.ts` reads all three and fails the build if they disagree, so
that class of bug cannot reach a release.

This checks the command *surface* — that every command exists in all three places under the
same name. It does not verify argument or payload field types; those still rely on the
hand-written types in `src/shared/ipc.ts` matching the Rust structs.
```

- [ ] **Step 3: Verify the README guards still pass**

Run: `bunx vitest run readme-versions`

Expected: PASS, 10 tests. The new text adds no table rows and names no removed tooling.

- [ ] **Step 4: Verify the whole suite**

Run: `bun run lint && bun run test:unit && make format-check`

Expected: all clean, 103 tests.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: document the IPC drift guard and its limits"
```

---

## Done criteria

- [ ] `tests/unit/ipc-surface.test.ts` exists and passes
- [ ] All three drift experiments were run and each produced a failing test; results recorded
- [ ] Working tree contains no experiment code
- [ ] README documents the guarantee and states the payload-type limit explicitly
- [ ] `bun run lint && bun run test:unit && make format-check` all clean

## Explicitly out of scope

- Argument-name and payload-field checking. A possible later strengthening; not this plan.
- Adopting `tauri-specta`. Revisit when a stable 2.0 ships.
- Recipes (`make add-*`). That is Phase 1b, planned separately.
