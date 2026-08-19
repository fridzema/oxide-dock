/**
 * Recipe: updater
 *
 * Wires in-app auto-updates: the Rust plugin, the JavaScript API, the
 * `updater:default` capability, and the `tauri.conf.json` config pointing at
 * this repository's GitHub release assets.
 *
 * It deliberately stops one step short. Update packages are signed, and the
 * recipe cannot generate — let alone safely store — your signing keypair, so
 * `plugins.updater.pubkey` is left empty and the run ends with the manual
 * steps. See recipes/updater/README.md.
 *
 * Run with `make add-updater`. Safe to run twice; a pubkey you have already
 * pasted in is never overwritten.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  addBunDependency,
  addCapabilityPermissions,
  addCargoDependency,
  formatJson,
  insertAtMarker,
  log,
  repoRoot,
} from '../_lib/apply'

const LIB_RS = 'src-tauri/src/lib.rs'
const TAURI_CONF = 'src-tauri/tauri.conf.json'
const CRATE = 'tauri-plugin-updater'
const CRATE_VERSION = '2.10.1'
const PACKAGE = '@tauri-apps/plugin-updater'
const PACKAGE_VERSION = '^2'
const PERMISSION = 'updater:default'
const FALLBACK_REPO = 'fridzema/oxide-dock'

/** `owner/name` of the GitHub remote, falling back to the template's own repo. */
function githubRepo(): string {
  try {
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return remote.match(/github\.com[:/](.+?)(?:\.git)?$/)?.[1] ?? FALLBACK_REPO
  } catch {
    return FALLBACK_REPO
  }
}

const repo = githubRepo()
const endpoint = `https://github.com/${repo}/releases/latest/download/latest.json`

type TauriConfig = Record<string, unknown>

/**
 * Merges the updater settings into tauri.conf.json.
 *
 * Idempotent in both directions: a second run adds nothing, and a run after
 * you have filled in `pubkey` leaves that key alone — the recipe only ever
 * seeds an empty one.
 */
function configureTauri(): void {
  const path = join(repoRoot, TAURI_CONF)
  const original = readFileSync(path, 'utf8')
  const config = JSON.parse(original) as TauriConfig

  const bundle = (config.bundle ?? {}) as Record<string, unknown>
  const plugins = (config.plugins ?? {}) as Record<string, unknown>
  const updater = (plugins.updater ?? {}) as Record<string, unknown>
  const endpoints = Array.isArray(updater.endpoints) ? updater.endpoints : []

  const alreadyConfigured =
    bundle.createUpdaterArtifacts === true &&
    typeof updater.pubkey === 'string' &&
    endpoints.includes(endpoint)
  if (alreadyConfigured) return

  bundle.createUpdaterArtifacts = true
  config.bundle = bundle

  if (typeof updater.pubkey !== 'string') {
    updater.pubkey = ''
  }
  if (!endpoints.includes(endpoint)) {
    endpoints.push(endpoint)
  }
  updater.endpoints = endpoints
  plugins.updater = updater
  config.plugins = plugins

  writeFileSync(path, formatJson(TAURI_CONF, config))
}

addCargoDependency(CRATE, CRATE_VERSION)
addBunDependency(PACKAGE, PACKAGE_VERSION)
insertAtMarker(LIB_RS, '// oxide:plugins', '.plugin(tauri_plugin_updater::Builder::new().build())')
addCapabilityPermissions([PERMISSION])
configureTauri()

console.log('Recipe: updater')
log(`${CRATE} ${CRATE_VERSION} is in src-tauri/Cargo.toml`)
log(`${PACKAGE} ${PACKAGE_VERSION} is in package.json — run \`bun install\``)
log(`the plugin is registered at // oxide:plugins in ${LIB_RS}`)
log(`${PERMISSION} is granted in src-tauri/capabilities/default.json`)
log(`${TAURI_CONF}: bundle.createUpdaterArtifacts = true`)
log(`${TAURI_CONF}: plugins.updater.endpoints = ["${endpoint}"]`)

console.log('')
console.log('  ============================================================================')
console.log('  ACTION REQUIRED — the updater does NOT work yet')
console.log('  ============================================================================')
console.log('')
console.log('  `plugins.updater.pubkey` in tauri.conf.json is an EMPTY STRING, because this')
console.log('  recipe cannot generate your signing keypair. Until you fix that:')
console.log('')
console.log('    - `bun tauri build` fails with "A public key has been found, but no private')
console.log('      key. Make sure to set `TAURI_SIGNING_PRIVATE_KEY` environment variable."')
console.log('    - any update it did download would fail signature verification')
console.log('')
console.log('  Three steps to finish:')
console.log('')
console.log('    1. bun tauri signer generate -w ~/.tauri/oxidedock.key')
console.log('    2. Paste the printed PUBLIC key into src-tauri/tauri.conf.json')
console.log('       at plugins.updater.pubkey (the whole string, not a file path)')
console.log('    3. Add the PRIVATE key and its password to your GitHub Actions secrets as')
console.log('       TAURI_SIGNING_PRIVATE_KEY and TAURI_SIGNING_PRIVATE_KEY_PASSWORD, and')
console.log('       pass both to the tauri-action step in .github/workflows/release.yml')
console.log('')
console.log('  Never commit the private key. Nothing calls check() yet either — the README')
console.log('  has a copy-paste snippet and the full walkthrough:')
console.log('')
console.log('    recipes/updater/README.md')
console.log('')
console.log('  ============================================================================')
