# window-state

```bash
make add-window-state
```

Remembers each window's size, position, and maximized/fullscreen state, and restores it on the
next launch. Without it every start reopens the app at the default size in the default place,
which is the kind of small thing users notice immediately.

## What it does

Registers [`tauri-plugin-window-state`](https://v2.tauri.app/plugin/window-state/) 2.4.1. The
plugin saves state when a window closes and applies it when a window is created, so there is
nothing to call and nothing to wire up.

## Files it changes

| File | Change |
| --- | --- |
| `src-tauri/Cargo.toml` | Adds `tauri-plugin-window-state = "2.4.1"` |
| `src-tauri/src/lib.rs` | Adds `.plugin(tauri_plugin_window_state::Builder::new().build())` at the `// oxide:plugins` anchor |

Two lines, and `src-tauri/Cargo.lock` picks up the new crate on the next build.

## No frontend code, no capability

The plugin works entirely from the Rust side, so `src/` is untouched and
`src-tauri/capabilities/default.json` needs no new permission. Only reach for the JavaScript
API (`@tauri-apps/plugin-window-state`) if you want to save or restore state manually — the
default behavior does not need it.

## Customizing

`Builder::new()` takes options for which pieces of state to persist and which windows to skip —
`with_state_flags()` to persist only size but not position, for instance, or `with_denylist()`
to exclude a splash window. See the
[plugin documentation](https://v2.tauri.app/plugin/window-state/) and the
[`Builder` API docs](https://docs.rs/tauri-plugin-window-state/latest/tauri_plugin_window_state/struct.Builder.html).

## Undo

```bash
git checkout -- src-tauri/Cargo.toml src-tauri/src/lib.rs
```

Recipes have no uninstall; reverting the diff is the supported undo.
