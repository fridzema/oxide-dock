# Roadmap Phase 0 — Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct every stale or wrong piece of OxideDock's public surface, make the README self-verifying, and open the highest-value distribution channel (awesome-tauri).

**Architecture:** Six independent tasks. Tasks 1, 2 and 4 change tracked files and commit. Tasks 3 and 5 change remote GitHub state via `gh` and commit nothing. Task 6 opens a pull request against a third-party repository and must run last, so that reviewers see the corrected README.

**Tech Stack:** Bun, Vitest 4, Biome 2, ESLint 10, `gh` CLI, ffmpeg + gifski.

Source spec: `docs/superpowers/specs/2026-08-18-roadmap-design.md`

---

## File Structure

| File | Responsibility |
| --- | --- |
| `tests/unit/readme-versions.test.ts` | Create. Fails when the README tech table drifts from `package.json`, or when removed tooling is still named. |
| `README.md` | Modify. Correct five stale version/tooling claims; add demo GIF and star-history chart. |
| `.vscode/settings.json` | Modify. Format on save with Biome instead of Prettier. |
| `.vscode/extensions.json` | Modify. Recommend the extensions actually in use. |
| `.vscode/launch.json` | Create. Rust/LLDB debug configurations. |
| `.vscode/tasks.json` | Create. `ui:dev` / `ui:build` tasks referenced by `launch.json`. |
| `.gitignore` | Modify. Un-ignore the two new `.vscode` files. |
| `.art/screens/demo.gif` | Create. Short demo recording. |

Coverage is unaffected: `vitest.config.ts` limits coverage `include` to `src/**`, and the new test touches no `src` file.

---

## Task 1: Make the README self-verifying

The README claims Vite v7, TypeScript v5, Pinia v3, and "Oxlint + Prettier". Reality: Vite 8, TypeScript 6, Pinia 4, Biome + ESLint. Fix it, and add a test so it cannot drift again.

**Files:**
- Create: `tests/unit/readme-versions.test.ts`
- Modify: `README.md:37-39`, `README.md:116`, `README.md:156-166`, `README.md:175`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/readme-versions.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// README tech-stack table row label → package.json dependency name.
// Rows documented as "latest" are intentionally unpinned and are not tracked here.
const TRACKED: Record<string, string> = {
  Vue: 'vue',
  Vite: 'vite',
  TypeScript: 'typescript',
  'Tailwind CSS': 'tailwindcss',
  'Vue Router': 'vue-router',
  Pinia: 'pinia',
  ESLint: 'eslint',
  Biome: '@biomejs/biome',
}

// Tooling removed from the project that must no longer appear anywhere in the README.
const REMOVED_TOOLING = ['Oxlint', 'Prettier']

const root = process.cwd()
const readme = readFileSync(resolve(root, 'README.md'), 'utf8')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies }

function documentedVersion(label: string): string | undefined {
  const row = readme
    .split('\n')
    .filter((line) => line.startsWith('|'))
    .map((line) => line.split('|').map((cell) => cell.trim()))
    .find((cells) => cells[1] === label)
  return row?.[2]
}

function installedMajor(dep: string): string {
  const range = deps[dep]
  if (!range) throw new Error(`package.json has no dependency "${dep}"`)
  return `v${range.replace(/^\D*/, '').split('.')[0]}`
}

describe('README tech stack table', () => {
  for (const [label, dep] of Object.entries(TRACKED)) {
    it(`documents the installed major version of ${dep}`, () => {
      expect(documentedVersion(label)).toBe(installedMajor(dep))
    })
  }
})

describe('README tooling references', () => {
  for (const tool of REMOVED_TOOLING) {
    it(`does not mention ${tool}, which the project no longer uses`, () => {
      expect(readme).not.toContain(tool)
    })
  }
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bunx vitest run readme-versions`

Expected: FAIL. Six failures — `Vite` expected `v8` got `v7`, `TypeScript` expected `v6` got `v5`,
`Pinia` expected `v4` got `v3`, `Biome` expected `v2` got `undefined`, plus the two
`does not mention Oxlint` / `does not mention Prettier` cases.

- [ ] **Step 3: Fix the feature list**

In `README.md`, replace these three lines (currently 37-39):

```markdown
- **ESLint** — flat config with Vue 3 + TypeScript rules
- **Prettier** — consistent code formatting
- **Oxlint** — fast supplemental linting
```

with:

```markdown
- **ESLint** — flat config with Vue 3 rules
- **Biome** — fast formatting and linting
```

- [ ] **Step 4: Fix the lint command description**

In `README.md`, replace line 116:

```markdown
| `make lint`         | Run all linters (ESLint + Oxlint + Clippy) |
```

with:

```markdown
| `make lint`         | Run all linters (ESLint + Biome + Clippy)  |
```

- [ ] **Step 5: Fix the tech stack table**

In `README.md`, replace these rows:

```markdown
| Vite         | v7      | Build tool                |
| TypeScript   | v5      | Type safety               |
```

with:

```markdown
| Vite         | v8      | Build tool                |
| TypeScript   | v6      | Type safety               |
```

Replace:

```markdown
| Pinia        | v3      | State management          |
```

with:

```markdown
| Pinia        | v4      | State management          |
```

Replace:

```markdown
| ESLint       | v10     | JS/TS/Vue linting         |
| Prettier     | v3      | Code formatting           |
| Oxlint       | latest  | Fast supplemental linting |
```

with:

```markdown
| ESLint       | v10     | Vue linting               |
| Biome        | v2      | Formatting and linting    |
```

- [ ] **Step 6: Fix the CI pipeline description**

In `README.md`, replace line 175:

```markdown
1. **Lint** — ESLint, Oxlint, Prettier check
```

with:

```markdown
1. **Lint** — ESLint, Biome check, TypeScript type check
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `bunx vitest run readme-versions`

Expected: PASS, 10 tests.

- [ ] **Step 8: Run the full lint and unit suite**

Run: `bun run lint && bun run test:unit`

Expected: no ESLint or Biome findings, all unit tests pass.

- [ ] **Step 9: Commit**

```bash
git add README.md tests/unit/readme-versions.test.ts
git commit -m "docs: correct stale tech stack claims and guard against drift"
```

---

## Task 2: Fix the VS Code configuration

`settings.json` formats with Prettier and auto-fixes with ESLint, but the project formats with Biome. Format-on-save currently produces changes that `make format-check` rejects. There is also no Rust debug configuration.

**Files:**
- Modify: `.vscode/settings.json`
- Modify: `.vscode/extensions.json`
- Create: `.vscode/launch.json`
- Create: `.vscode/tasks.json`
- Modify: `.gitignore:11-13`

- [ ] **Step 1: Reproduce the conflict**

Run:

```bash
bunx prettier --version 2>/dev/null || echo "prettier is not installed"
grep -n "defaultFormatter" .vscode/settings.json
```

Expected: `prettier is not installed`, and `settings.json` naming `esbenp.prettier-vscode`.
This confirms the editor is configured to use a formatter the project does not have.

- [ ] **Step 2: Rewrite `.vscode/settings.json`**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[vue]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer",
    "editor.formatOnSave": true
  },
  "rust-analyzer.linkedProjects": ["src-tauri/Cargo.toml"],
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

- [ ] **Step 3: Rewrite `.vscode/extensions.json`**

```json
{
  "recommendations": [
    "vue.volar",
    "biomejs.biome",
    "dbaeumer.vscode-eslint",
    "rust-lang.rust-analyzer",
    "vadimcn.vscode-lldb",
    "bradlc.vscode-tailwindcss",
    "tauri-apps.tauri-vscode"
  ]
}
```

`esbenp.prettier-vscode` and `oxc.oxc-vscode` are removed because neither tool is in the project.
`vadimcn.vscode-lldb` is added because `launch.json` below requires it.

- [ ] **Step 4: Create `.vscode/tasks.json`**

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "ui:dev",
      "type": "shell",
      "isBackground": true,
      "command": "bun",
      "args": ["run", "dev"],
      "problemMatcher": {
        "owner": "vite",
        "pattern": { "regexp": "^$" },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "VITE",
          "endsPattern": "ready in"
        }
      }
    },
    {
      "label": "ui:build",
      "type": "shell",
      "command": "bun",
      "args": ["run", "build"]
    }
  ]
}
```

- [ ] **Step 5: Create `.vscode/launch.json`**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "lldb",
      "request": "launch",
      "name": "Tauri Development Debug",
      "cargo": {
        "args": ["build", "--manifest-path=./src-tauri/Cargo.toml", "--no-default-features"]
      },
      "preLaunchTask": "ui:dev"
    },
    {
      "type": "lldb",
      "request": "launch",
      "name": "Tauri Production Debug",
      "cargo": {
        "args": ["build", "--release", "--manifest-path=./src-tauri/Cargo.toml"]
      },
      "preLaunchTask": "ui:build"
    }
  ]
}
```

- [ ] **Step 6: Un-ignore the new files in `.gitignore`**

Replace lines 11-13:

```gitignore
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
```

with:

```gitignore
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
!.vscode/launch.json
!.vscode/tasks.json
```

- [ ] **Step 7: Verify the files are tracked and well-formed**

Run:

```bash
git add -A .vscode .gitignore
git status --short .vscode
bunx biome check .vscode
```

Expected: all four `.vscode` files staged, `biome check` reports no findings.
If Biome reports formatting differences, run `bunx biome check --write .vscode` and re-stage.

- [ ] **Step 8: Verify the whole project still lints**

Run: `bun run lint`

Expected: no findings.

- [ ] **Step 9: Commit**

```bash
git add .vscode .gitignore
git commit -m "fix(vscode): format with Biome and add Rust debug configuration"
```

---

## Task 3: Correct repository metadata

`desktop-` is a typo occupying a topic slot, and `homepageUrl` is empty. GitHub topic pages are a real search surface for template repos.

**Files:** none — this changes remote GitHub state only.

- [ ] **Step 1: Record the current topics**

Run: `gh api repos/fridzema/oxide-dock/topics --jq '.names'`

Expected: `["cross-platform","desktop-","electron-alternative","rust","starter-kit","starter-template","tauri","typescript","vite","vue"]`

- [ ] **Step 2: Remove the typo topic**

Run: `gh repo edit fridzema/oxide-dock --remove-topic desktop-`

- [ ] **Step 3: Add the missing topics**

```bash
gh repo edit fridzema/oxide-dock \
  --add-topic desktop \
  --add-topic vue3 \
  --add-topic tauri-v2 \
  --add-topic boilerplate \
  --add-topic tailwindcss \
  --add-topic pinia \
  --add-topic bun
```

- [ ] **Step 4: Set the homepage**

The docs site does not exist yet, so point at releases for now. Phase 2 replaces this.

Run:

```bash
gh repo edit fridzema/oxide-dock --homepage "https://github.com/fridzema/oxide-dock/releases"
```

- [ ] **Step 5: Verify**

Run:

```bash
gh api repos/fridzema/oxide-dock/topics --jq '.names'
gh repo view fridzema/oxide-dock --json homepageUrl
```

Expected: 16 topics, `desktop-` absent, `desktop` present; `homepageUrl` set to the releases URL.

---

## Task 4: Add demo GIF and star-history chart to the README

The current README shows one static screenshot. A template whose pitch is speed and DX should show motion, and a star-history chart is social proof that costs one line.

**Files:**
- Create: `.art/screens/demo.gif`
- Modify: `README.md`

- [ ] **Step 1: Install the recording toolchain**

Run: `brew install ffmpeg gifski`

Verify: `ffmpeg -version && gifski --version` both print a version.

- [ ] **Step 2: Record the demo**

Record 12-15 seconds showing: a terminal running `make dev`, then the OxideDock window
appearing and one demo component being used (clipboard or notification). Use
`Cmd+Shift+5` on macOS, save to `~/Desktop/oxide-demo.mov`.

- [ ] **Step 3: Convert to a GIF**

```bash
mkdir -p /tmp/oxide-frames .art/screens
ffmpeg -i ~/Desktop/oxide-demo.mov -vf "fps=15,scale=900:-1:flags=lanczos" /tmp/oxide-frames/frame%04d.png
gifski -o .art/screens/demo.gif --fps 15 --quality 85 /tmp/oxide-frames/frame*.png
ls -lh .art/screens/demo.gif
```

Expected: a GIF under 5 MB. If larger, re-run `gifski` with `--quality 70` or
lower `scale=` to `720`.

- [ ] **Step 4: Reference the GIF in the README**

Directly below the existing screenshot block in `README.md`:

```html
<p align="center">
  <img src=".art/screens/screen.png" alt="OxideDock screenshot" width="700" />
</p>
```

add:

```html
<p align="center">
  <img src=".art/screens/demo.gif" alt="make dev to a running OxideDock window" width="700" />
</p>
```

- [ ] **Step 5: Add the star-history section**

In `README.md`, immediately before the `## Contributing` heading, insert:

```markdown
## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=fridzema/oxide-dock&type=Date)](https://star-history.com/#fridzema/oxide-dock&Date)
```

- [ ] **Step 6: Verify the README still passes its own test**

Run: `bunx vitest run readme-versions`

Expected: PASS, 10 tests. (The inserted text names no removed tooling and adds no table rows.)

- [ ] **Step 7: Commit**

```bash
git add README.md .art/screens/demo.gif
git commit -m "docs: add demo GIF and star history chart"
```

---

## Task 5: Seed GitHub Discussions

Discussions are enabled but empty, which reads as abandoned. One pinned thread turns the
"Built with OxideDock" README section into an ongoing intake channel.

**Files:** none — remote GitHub state only.

- [ ] **Step 1: Look up the repository and category IDs**

```bash
gh api graphql -f query='
  query {
    repository(owner: "fridzema", name: "oxide-dock") {
      id
      discussionCategories(first: 10) { nodes { id name } }
    }
  }'
```

Note the repository `id` and the `id` of the `Show and tell` category. If that category
does not exist, create it in the repository settings UI first, then re-run this query.

- [ ] **Step 2: Create the discussion**

Substitute the two IDs from Step 1:

```bash
gh api graphql \
  -f query='
    mutation($repo: ID!, $cat: ID!, $title: String!, $body: String!) {
      createDiscussion(input: {repositoryId: $repo, categoryId: $cat, title: $title, body: $body}) {
        discussion { url }
      }
    }' \
  -f repo='<REPOSITORY_ID>' \
  -f cat='<CATEGORY_ID>' \
  -f title='Show what you built with OxideDock' \
  -f body='Shipped something on top of OxideDock? Post it here — a link, a screenshot, and one line about what it does.

Anything posted here is eligible for the "Built with OxideDock" section of the README. Rough and unfinished is fine; seeing what people actually build directs what lands in the template next.

Useful to mention if you have it: platforms you ship to, which parts of the template you kept, and anything you had to fight.'
```

Expected: the mutation returns the new discussion URL.

- [ ] **Step 3: Pin the discussion**

GitHub exposes no stable API for pinning discussions. Open the returned URL and use the
"Pin discussion" control in the right-hand sidebar.

- [ ] **Step 4: Verify**

Run: `gh api repos/fridzema/oxide-dock/discussions --jq '.[].title'`

Expected: `Show what you built with OxideDock` is listed.

---

## Task 6: Submit the awesome-tauri pull request

OxideDock is absent from `tauri-apps/awesome-tauri`. This is the single highest-value
distribution action available and it is permanent. Run this task **last**, so reviewers
land on the corrected README from Tasks 1 and 4.

**Files:** none in this repository — this modifies a fork of `tauri-apps/awesome-tauri`.

- [ ] **Step 1: Confirm eligibility against their guidelines**

Their `Templates` rules require Tauri 2.x, a repo at least 30 days old, English docs,
clear getting-started information, and meaningful difference from existing entries.

```bash
gh repo view fridzema/oxide-dock --json createdAt
grep -n 'tauri = ' src-tauri/Cargo.toml
```

Expected: created `2026-02-13` (well over 30 days), `tauri = { version = "2", ... }`.

- [ ] **Step 2: Fork and clone**

```bash
cd /private/tmp/claude-501/-Users-fridzema-workspace-oxide-dock/155a649a-3162-49dd-920d-258d669e4398/scratchpad
gh repo fork tauri-apps/awesome-tauri --clone
cd awesome-tauri
git checkout -b add-oxide-dock
```

- [ ] **Step 3: Insert the entry alphabetically**

Entries are sorted by title. `oxide-dock` sorts after `nuxtor` and before
`rust-full-stack-with-authentication-template`.

```bash
awk '/^- \[nuxtor\]/{print; print "- [oxide-dock](https://github.com/fridzema/oxide-dock) ![v2] - Vue 3 with Vite, Tailwind CSS, typed Rust bridge, Vitest, Playwright, coverage-gated Rust tests, and automated cross-platform releases via `release-please`."; next}1' README.md > README.tmp && mv README.tmp README.md
```

This description satisfies their rules: 20 words, no leading `A`/`An`, no links, no
parentheses, package name in backticks, `![v2]` badge after the link.

- [ ] **Step 4: Verify the insertion and the lint**

```bash
grep -n -A 1 '^- \[nuxtor\]' README.md
bun install
bun run lint
```

Expected: the new line appears directly after `nuxtor`, and `awesome-lint` reports no errors.

- [ ] **Step 5: Commit with a signature**

Their guidelines require signed commits.

```bash
git add README.md
git commit -S -m "add oxide-dock template"
git log --show-signature -1 | head -5
```

Expected: the log output shows a good signature. If signing fails, configure it first —
`git config --global gpg.format ssh` and `git config --global user.signingkey <key>` —
then amend with `git commit -S --amend --no-edit`.

- [ ] **Step 6: Open the pull request**

```bash
gh pr create --repo tauri-apps/awesome-tauri --title "add oxide-dock template" --body 'Adds [oxide-dock](https://github.com/fridzema/oxide-dock), a Tauri v2 + Vue 3 starter.

Checklist:
- Works with Tauri 2.x
- Repo created 2026-02-13, well over 30 days old
- Documentation in English, with quick start and a full command reference
- One suggestion in this PR
- Entry added alphabetically to Templates
- Commit is signed

How it differs from the existing Vue entries: `tauri-vue-template` covers Vue + TypeScript + Vitest + GitHub Actions, and `tauri-vue-template-2` is a JavaScript template. oxide-dock adds Playwright e2e, a coverage-gated Rust test suite, `cargo-audit`, structured Rust error types with a typed IPC layer, Lefthook and commitlint hooks, and fully automated cross-platform releases via release-please that publish .deb, .AppImage, .dmg, .msi and .exe artifacts.'
```

- [ ] **Step 7: Verify**

Run: `gh pr list --repo tauri-apps/awesome-tauri --author @me`

Expected: the pull request is listed as open.

---

## Done criteria

- [ ] `bun run lint && bun run test:unit` passes on `main`
- [ ] README names no tool the project does not use, and its version table matches `package.json`
- [ ] Format-on-save in VS Code produces output that `make format-check` accepts
- [ ] Repository has 16 topics, no `desktop-`, and a non-empty homepage
- [ ] README shows a demo GIF and a star-history chart
- [ ] A pinned "Show what you built" discussion exists
- [ ] The awesome-tauri pull request is open
