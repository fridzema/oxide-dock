# Recommended Tauri Plugins

> **Note:** `tauri-plugin-log` is already included in this template. See `src-tauri/src/lib.rs` for configuration.

These plugins are not included by default to keep the template lean, but are recommended for production apps.

## tauri-plugin-window-state — Window Persistence

Saves and restores window position and size across restarts.

```bash
make add-window-state
```

The recipe adds the dependency and registers the plugin; no frontend code is needed. See
[`recipes/window-state/README.md`](../recipes/window-state/README.md).

## tauri-plugin-updater — Auto-Updates

Checks for and installs app updates from GitHub Releases.

```bash
make add-updater
```

The recipe adds both dependencies, registers the plugin, grants `updater:default`, and writes the
`tauri.conf.json` config. It stops short of the signing keypair, which you must generate yourself —
[`recipes/updater/README.md`](../recipes/updater/README.md) walks through generating it, where the
public key goes, the CI secrets, and calling `check()` from the frontend.

See [`recipes/README.md`](../recipes/README.md) for how recipes work and what else is available.
