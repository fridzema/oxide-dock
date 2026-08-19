# Recipes

Recipes are scripted, idempotent, CI-verified feature installs. Run one and it wires a feature
into your checkout correctly — dependency, plugin registration, capability, config — instead of
leaving you to follow prose and hope you did not miss a step.

## Why the core stays lean

Every plugin in the template is a plugin every user pays for: bigger binaries, more permissions,
more surface to audit, more to rip out when you do not want it. So OxideDock ships a small,
opinionated core and moves the optional pieces here. You get a lean starting point, and one
command when you want more.

## Running a recipe

```bash
make add-<name>
```

That runs `recipes/<name>/apply.ts` with Bun. Each recipe prints what it changed and points at
its own README for anything it could not do for you.

Recipes modify your checkout. They are meant to be run once and committed — review the diff
first, exactly as you would review any change. `git checkout --` is the supported undo; recipes
have no uninstall.

## Available recipes

| Recipe | Command | What it adds |
| --- | --- | --- |
| `window-state` | `make add-window-state` | Window size and position remembered across restarts |
| `tray` | `make add-tray` | A system tray icon with a menu |
| `updater` | `make add-updater` | In-app auto-updates (you supply the signing keys) |

## Idempotency

Running a recipe twice leaves the tree exactly as one run did, and does not error. That matters
because you will forget whether you already ran it, and because it means a recipe can be re-run
after a merge without producing duplicate plugin lines or duplicate dependencies.

## Verified in CI

Every recipe is applied to a clean checkout on every pull request, then linted, tested and
type-checked, then applied a second time to prove the result is unchanged. Full cross-platform
Tauri builds for each recipe run nightly. A recipe that rots is worse than no recipe, so the
build catches it rather than you.

## How insertion works

`src-tauri/src/lib.rs` and `src/main.ts` carry anchor comments:

| Anchor | File | Purpose |
| --- | --- | --- |
| `// oxide:plugins` | `src-tauri/src/lib.rs` | End of the Tauri plugin chain |
| `// oxide:setup` | `src-tauri/src/lib.rs` | Inside the builder's `.setup()` closure |
| `// oxide:frontend-init` | `src/main.ts` | Before `app.mount('#app')` |

Recipes insert at those anchors and nowhere else. They never regex-rewrite arbitrary source,
which is how "add feature" tooling usually rots. If you move an anchor, keep the comment — a
recipe that cannot find its anchor fails loudly and names the file and marker it wanted.

Keep the anchors even if you never run a recipe. They cost one comment each.

## Writing a recipe

A recipe is a directory containing `apply.ts` and `README.md`. The shared helpers live in
`recipes/_lib/apply.ts`:

| Helper | Does |
| --- | --- |
| `insertAtMarker(file, marker, code)` | Inserts code above an anchor, matching its indentation |
| `addCargoDependency(name, version)` | Adds a crate to `src-tauri/Cargo.toml` |
| `addCargoFeatures(crate, features)` | Merges features into an existing crate entry |
| `addBunDependency(name, version)` | Adds a runtime dependency to `package.json` |
| `addCapabilityPermissions(perms)` | Merges into `src-tauri/capabilities/default.json` |
| `log(message)` | Consistent recipe output |

All of them are no-ops when the change is already present, so a recipe built from them is
idempotent by construction. Anything a recipe cannot do for you — generating signing keys, for
instance — belongs in a loud closing message and in the recipe's README, never left silent.
