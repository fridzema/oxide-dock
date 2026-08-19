# updater

```bash
make add-updater
```

In-app auto-updates from GitHub Releases: the app asks a URL whether a newer version exists,
downloads it, checks that you signed it, and installs it. It is the difference between shipping
v1.1 and hoping people notice, and shipping v1.1 and having them on it the next morning.

## Read this first: the recipe cannot finish the job

Every update package is signed, and the app only installs updates that carry a signature matching
a public key baked into it. Generating that keypair means creating a secret, choosing a password
for it, and storing it somewhere only you control — so the recipe does not do it for you. It
writes an **empty** `pubkey` into `src-tauri/tauri.conf.json` and stops.

Until you complete [Finish the setup](#finish-the-setup):

- `bun tauri build` fails during bundling with
  `A public key has been found, but no private key. Make sure to set TAURI_SIGNING_PRIVATE_KEY
  environment variable.`
- Nothing verifies: an update the app downloaded would fail signature verification and never
  install.

The app still compiles, still runs under `make dev`, and `bun run build` (frontend only) is
unaffected. It is the release build and the update itself that are blocked.

## What it does

Registers [`tauri-plugin-updater`](https://v2.tauri.app/plugin/updater/) 2.10.1 on the Rust side,
adds its JavaScript API to `package.json`, grants the capability the frontend needs to call it,
and turns on updater artifact generation in the bundler.

## Files it changes

| File | Change |
| --- | --- |
| `src-tauri/Cargo.toml` | Adds `tauri-plugin-updater = "2.10.1"` |
| `src-tauri/src/lib.rs` | Adds `.plugin(tauri_plugin_updater::Builder::new().build())` at the `// oxide:plugins` anchor |
| `package.json` | Adds `@tauri-apps/plugin-updater` — run `bun install` afterwards |
| `src-tauri/capabilities/default.json` | Adds the `updater:default` permission |
| `src-tauri/tauri.conf.json` | Sets `bundle.createUpdaterArtifacts` to `true` and adds a `plugins.updater` block |

The config it writes:

```json
"bundle": {
  "createUpdaterArtifacts": true
},
"plugins": {
  "updater": {
    "pubkey": "",
    "endpoints": [
      "https://github.com/fridzema/oxide-dock/releases/latest/download/latest.json"
    ]
  }
}
```

The endpoint is derived from your `origin` remote, so a fork points at the fork. Change it by hand
if you publish releases somewhere else — the endpoint may be any URL that serves the `latest.json`
shape, and supports the `{{target}}`, `{{arch}}` and `{{current_version}}` placeholders.

`createUpdaterArtifacts: true` is the setting for apps that were born on Tauri v2, which this
template is. `"v1Compatible"` exists only for apps migrating from Tauri v1 with v1-era installs in
the wild, and it is scheduled for removal in Tauri v3.

`updater:default` bundles `allow-check`, `allow-download`, `allow-install` and
`allow-download-and-install`. Narrow it later if you only ever want to check.

## Finish the setup

### 1. Generate a keypair

```bash
bun tauri signer generate -w ~/.tauri/oxidedock.key
```

It asks for a password (press Enter twice for none — but a password is worth having, and CI
handles one fine), then writes:

- `~/.tauri/oxidedock.key` — the **private** key. Signs update packages at release time. Secret.
- `~/.tauri/oxidedock.key.pub` — the **public** key. Ships inside your app and is what proves an
  update came from you. Not secret; it belongs in version control.

Two things to understand before you move on:

- **Back the private key up.** It is not recoverable. If you lose it you cannot sign an update
  that already-installed copies will accept; those users have to reinstall by hand.
- **Do not rotate it casually.** The public key compiled into an installed app is the only one it
  trusts, so a new keypair orphans every existing install exactly the same way.

Neither the key file nor its password ever belongs in the repository. `~/.tauri/` is outside the
project on purpose.

### 2. Paste the public key into `tauri.conf.json`

```bash
cat ~/.tauri/oxidedock.key.pub
```

Copy the whole thing — one long `dW50cnVzdGVkIGNvbW1lbnQ6...` string — into
`src-tauri/tauri.conf.json`:

```json
"plugins": {
  "updater": {
    "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6...",
    "endpoints": ["https://github.com/fridzema/oxide-dock/releases/latest/download/latest.json"]
  }
}
```

It must be the key's contents, not a path to the file. Commit it — it is public by design, and it
has to be in the build for the app to trust anything.

Re-running `make add-updater` after this will not overwrite it.

### 3. Give CI the private key

```bash
gh secret set TAURI_SIGNING_PRIVATE_KEY < ~/.tauri/oxidedock.key
gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD   # paste the password, or leave empty
```

Then hand both to the build step in `.github/workflows/release.yml` — the recipe does not touch
workflows:

```yaml
- uses: tauri-apps/tauri-action@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
```

For a local release build, export the same two variables. To build locally without signing at all,
use `bun tauri build --no-sign`.

## How `latest.json` gets there

With `createUpdaterArtifacts` on, `tauri build` produces an update package next to the normal
installer and signs it, writing a `.sig` file beside it. `tauri-action` then generates a
`latest.json` from those artifacts and uploads it to the GitHub Release for the tag:

```json
{
  "version": "0.9.0",
  "notes": "...",
  "pub_date": "2026-08-19T10:00:00Z",
  "platforms": {
    "darwin-aarch64": { "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...", "url": "https://github.com/.../OxideDock_aarch64.app.tar.gz" },
    "windows-x86_64": { "signature": "...", "url": "https://github.com/.../OxideDock_0.9.0_x64-setup.nsis.zip" }
  }
}
```

The configured endpoint — `/releases/latest/download/latest.json` — always resolves to the newest
**published, non-prerelease** release, so no URL changes per version. The release matrix in
`release.yml` runs four platform legs against the same release, so `latest.json` fills in as each
leg finishes; a release is only fully updatable once they all have.

The app compares its own `version` from `tauri.conf.json` against the `version` in `latest.json`.
Bumping the version is release-please's job here, so a normal release flow is enough.

## Calling it from the frontend

Nothing calls the updater on its own. The smallest useful version:

```ts
import { check } from '@tauri-apps/plugin-updater'

export async function checkForUpdates(): Promise<void> {
  try {
    const update = await check()
    if (!update) return

    console.info(`Update ${update.version} available`)
    await update.downloadAndInstall()
  } catch (err) {
    console.error('Update check failed:', err)
  }
}
```

`check()` returns `null` when you are already on the newest version, and throws when the endpoint
is unreachable or returns nothing usable; `downloadAndInstall()` throws when the signature does
not verify — which is what an empty `pubkey` gets you. The `try`/`catch` is not decoration. In a
real app, ask before downloading rather than installing silently, and use the progress callback
for anything large:

```ts
await update.downloadAndInstall((event) => {
  if (event.event === 'Progress') {
    console.info(`downloaded ${event.data.chunkLength} bytes`)
  }
})
```

Call it from `src/main.ts` at the `// oxide:frontend-init` anchor, or from a component's
`onMounted` — on app start, or behind a "Check for updates" menu item.

**Restarting.** On Windows the installer closes the app to replace it, so code after
`downloadAndInstall()` may never run. Elsewhere you restart yourself, which needs the process
plugin:

```bash
cd src-tauri && cargo add tauri-plugin-process
bun add @tauri-apps/plugin-process
```

Add `.plugin(tauri_plugin_process::init())` at the `// oxide:plugins` anchor and
`"process:default"` to `src-tauri/capabilities/default.json`, then:

```ts
import { relaunch } from '@tauri-apps/plugin-process'

await update.downloadAndInstall()
await relaunch()
```

**Testing it.** An update check only means anything in a bundled build with a real version number,
against a release that actually exists — `make dev` runs the dev version and there is nothing
newer to find. Ship one release, bump the version, ship a second, then install the first and run
it.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Build fails: `A public key has been found, but no private key` | `TAURI_SIGNING_PRIVATE_KEY` is not set for that build. Set it, or `--no-sign` |
| Build warns the secret key does not match `plugins > updater > pubkey` | The `pubkey` in the config came from a different keypair than the one signing |
| `check()` always returns `null` | `latest.json` version is not greater than the app's `version` |
| `check()` throws a 404 | No published release yet, or the release is a draft or prerelease |
| Update downloads, then fails verification | Signature was made with a key that does not match the built-in `pubkey` |

See the [Tauri updater plugin docs](https://v2.tauri.app/plugin/updater/) for the endpoint
contract, custom `Updater` builders, and per-platform install behavior.

## Undo

```bash
git checkout -- src-tauri/Cargo.toml src-tauri/src/lib.rs src-tauri/tauri.conf.json \
  src-tauri/capabilities/default.json package.json bun.lock
```

Recipes have no uninstall; reverting the diff is the supported undo.
