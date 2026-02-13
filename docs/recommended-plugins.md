# Recommended Tauri Plugins

These plugins are not included by default to keep the template lean, but are recommended for production apps.

## tauri-plugin-log — Structured Logging

Adds file and console logging for the Rust backend.

**Install:**

```bash
# Rust
cd src-tauri && cargo add tauri-plugin-log

# No frontend package needed — logs are Rust-side
```

**Setup in `src-tauri/src/lib.rs`:**

```rust
use tauri_plugin_log::{Target, TargetKind};

tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::new()
        .targets([
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::LogDir { file_name: None }),
        ])
        .build())
    // ... other plugins
```

**Usage:**

```rust
log::info!("Application started");
log::error!("Something went wrong: {}", err);
```

## tauri-plugin-window-state — Window Persistence

Saves and restores window position and size across restarts.

**Install:**

```bash
cd src-tauri && cargo add tauri-plugin-window-state
```

**Setup in `src-tauri/src/lib.rs`:**

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_window_state::Builder::new().build())
    // ... other plugins
```

No frontend code needed — it works automatically.

## tauri-plugin-updater — Auto-Updates

Enables checking for and installing app updates from GitHub Releases.

**Install:**

```bash
# Rust
cd src-tauri && cargo add tauri-plugin-updater

# Frontend
bun add @tauri-apps/plugin-updater
```

**Setup:**

1. Generate a signing keypair:

   ```bash
   bun tauri signer generate -w ~/.tauri/oxidedock.key
   ```

2. Add the private key to your CI secrets as `TAURI_SIGNING_PRIVATE_KEY`.

3. Add the public key to `src-tauri/tauri.conf.json`:

   ```json
   "bundle": {
     "createUpdaterArtifacts": "v1Compatible"
   },
   "plugins": {
     "updater": {
       "pubkey": "YOUR_PUBLIC_KEY_HERE",
       "endpoints": [
         "https://github.com/fridzema/oxide-dock/releases/latest/download/latest.json"
       ]
     }
   }
   ```

4. Register the plugin in `src-tauri/src/lib.rs`:

   ```rust
   .plugin(tauri_plugin_updater::Builder::new().build())
   ```

5. Check for updates in the frontend:

   ```typescript
   import { check } from '@tauri-apps/plugin-updater'

   const update = await check()
   if (update) {
     await update.downloadAndInstall()
   }
   ```

See the [Tauri Updater docs](https://v2.tauri.app/plugin/updater/) for full details.
