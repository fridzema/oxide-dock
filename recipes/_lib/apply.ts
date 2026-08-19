/**
 * Shared helpers for OxideDock recipes.
 *
 * Every helper is idempotent: running a recipe twice leaves the working tree
 * exactly as one run did, and never throws on the second pass. Insertions into
 * source files happen at explicit `// oxide:` anchor comments — recipes never
 * regex-rewrite arbitrary source.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Repository root, derived from this file's location (recipes/_lib/apply.ts). */
export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

const CARGO_TOML = 'src-tauri/Cargo.toml'
const PACKAGE_JSON = 'package.json'
const CAPABILITIES_JSON = 'src-tauri/capabilities/default.json'

/** Consistent recipe output. */
export function log(message: string): void {
  console.log(`  ${message}`)
}

function resolvePath(filePath: string): string {
  return isAbsolute(filePath) ? filePath : join(repoRoot, filePath)
}

function read(filePath: string): string {
  const absolute = resolvePath(filePath)
  if (!existsSync(absolute)) {
    throw new Error(`File not found: ${relative(repoRoot, absolute)}`)
  }
  return readFileSync(absolute, 'utf8')
}

/** Writes only when the content actually changed, so re-runs never touch the file. */
function write(filePath: string, content: string): boolean {
  const absolute = resolvePath(filePath)
  if (existsSync(absolute) && readFileSync(absolute, 'utf8') === content) {
    return false
  }
  writeFileSync(absolute, content)
  return true
}

/**
 * Resolves a Biome executable that cannot be something else.
 *
 * Never invoke a bare `bunx biome`: with `node_modules` present that resolves
 * to the local `@biomejs/biome`, but without it bunx downloads an unrelated
 * npm package that happens to be named `biome`, which exits 0 and prints
 * nothing. Prefer the local binary, and name the scoped package otherwise.
 */
function biomeCommand(): { file: string; prefix: string[] } {
  const local = join(repoRoot, 'node_modules', '.bin', 'biome')
  return existsSync(local)
    ? { file: local, prefix: [] }
    : { file: 'bunx', prefix: ['--bun', '@biomejs/biome'] }
}

/** Pipes `input` through `biome format`, returning what Biome wrote to stdout. */
function runBiomeFormat(filePath: string, input: string): string {
  const { file, prefix } = biomeCommand()
  return execFileSync(file, [...prefix, 'format', `--stdin-file-path=${filePath}`], {
    cwd: repoRoot,
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  })
}

/**
 * Runs Biome's formatter over generated JSON so the result matches what
 * `make format-check` expects.
 *
 * Only ever returns a string this function has parsed as JSON. A formatter
 * that throws, prints nothing, or prints something that is not JSON is a
 * formatter failure, not a licence to overwrite a tracked file with it — that
 * is how a stray binary named `biome` truncates package.json to zero bytes.
 * On any such failure the plain 2-space rendering is used instead: valid JSON,
 * just not Biome-formatted, and the recipe says so rather than failing
 * silently. `format` is injectable so tests can drive the failure paths.
 */
export function formatJson(
  filePath: string,
  value: unknown,
  format: (filePath: string, input: string) => string = runBiomeFormat,
): string {
  const raw = `${JSON.stringify(value, null, 2)}\n`
  const unformatted = (): string => {
    log(`could not format ${filePath} with Biome — run "bun run format" before committing`)
    return raw
  }

  let formatted: string
  try {
    formatted = format(filePath, raw)
  } catch {
    return unformatted()
  }

  try {
    JSON.parse(formatted)
  } catch {
    return unformatted()
  }
  return formatted
}

function stripIndent(code: string): string[] {
  const lines = code.replace(/\t/g, '  ').split('\n')
  while (lines.length > 0 && lines[0]?.trim() === '') lines.shift()
  while (lines.length > 0 && lines[lines.length - 1]?.trim() === '') lines.pop()
  const indents = lines
    .filter((line) => line.trim() !== '')
    .map((line) => (line.match(/^ */) ?? [''])[0].length)
  const common = indents.length > 0 ? Math.min(...indents) : 0
  return lines.map((line) => (line.trim() === '' ? '' : line.slice(common)))
}

/** True when `block` already appears in `lines` as a contiguous run, ignoring indentation. */
function containsBlock(lines: string[], block: string[]): boolean {
  if (block.length === 0) return true
  const haystack = lines.map((line) => line.trim())
  const needle = block.map((line) => line.trim())
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    if (needle.every((line, j) => haystack[i + j] === line)) return true
  }
  return false
}

/**
 * Inserts `code` on the line before `marker`, matching the marker's own
 * indentation. No-op if the code is already present. Throws if the marker is
 * missing, naming both the file and the marker.
 */
export function insertAtMarker(filePath: string, marker: string, code: string): void {
  const content = read(filePath)
  const lines = content.split('\n')
  const block = stripIndent(code)
  if (containsBlock(lines, block)) return

  const wanted = marker.trim()
  const index = lines.findIndex((line) => line.trim() === wanted)
  if (index === -1) {
    throw new Error(
      `Marker "${wanted}" not found in ${filePath}. ` +
        'Recipes insert at oxide anchor comments — restore the anchor and re-run.',
    )
  }

  const indent = (lines[index]?.match(/^\s*/) ?? [''])[0]
  const indented = block.map((line) => (line === '' ? '' : `${indent}${line}`))
  lines.splice(index, 0, ...indented)
  write(filePath, lines.join('\n'))
}

function cargoDependencySection(lines: string[]): { start: number; end: number } {
  const start = lines.findIndex((line) => line.trim() === '[dependencies]')
  if (start === -1) {
    throw new Error(`No [dependencies] section in ${CARGO_TOML}`)
  }
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i]?.trimStart().startsWith('[')) {
      end = i
      break
    }
  }
  return { start, end }
}

function findCargoDependency(lines: string[], crate: string): number {
  const { start, end } = cargoDependencySection(lines)
  for (let i = start + 1; i < end; i++) {
    const key = lines[i]?.split('=')[0]?.trim().replace(/^"|"$/g, '')
    if (key === crate) return i
  }
  return -1
}

/** Adds `name = "version"` to `[dependencies]`. No-op if the crate is already listed. */
export function addCargoDependency(name: string, version: string): void {
  const lines = read(CARGO_TOML).split('\n')
  if (findCargoDependency(lines, name) !== -1) return

  const { end } = cargoDependencySection(lines)
  let insertAt = end
  while (insertAt > 0 && lines[insertAt - 1]?.trim() === '') insertAt--
  lines.splice(insertAt, 0, `${name} = "${version}"`)
  write(CARGO_TOML, lines.join('\n'))
}

function parseFeatureList(list: string): string[] {
  return list
    .split(',')
    .map((entry) => entry.trim().replace(/^["']|["']$/g, ''))
    .filter((entry) => entry !== '')
}

/** Merges `features` into an existing dependency entry, keeping any already there. */
export function addCargoFeatures(crate: string, features: string[]): void {
  const lines = read(CARGO_TOML).split('\n')
  const index = findCargoDependency(lines, crate)
  if (index === -1) {
    throw new Error(`Dependency "${crate}" not found in ${CARGO_TOML}`)
  }

  const line = lines[index] ?? ''
  const inlineTable = line.match(/^(\s*[^=]+=\s*)\{(.*)\}(\s*)$/)
  const plainVersion = line.match(/^(\s*[^=]+=\s*)"([^"]*)"(\s*)$/)

  let updated: string
  if (inlineTable) {
    const [, head = '', body = '', tail = ''] = inlineTable
    const existing = body.match(/features\s*=\s*\[([^\]]*)\]/)
    if (existing) {
      const current = parseFeatureList(existing[1] ?? '')
      const merged = [...current, ...features.filter((f) => !current.includes(f))]
      if (merged.length === current.length) return
      const rendered = merged.map((f) => `"${f}"`).join(', ')
      updated = `${head}{${body.replace(existing[0], `features = [${rendered}]`)}}${tail}`
    } else {
      const rendered = features.map((f) => `"${f}"`).join(', ')
      updated = `${head}{${body.trimEnd()}, features = [${rendered}] }${tail}`
    }
  } else if (plainVersion) {
    const [, head = '', version = '', tail = ''] = plainVersion
    const rendered = features.map((f) => `"${f}"`).join(', ')
    updated = `${head}{ version = "${version}", features = [${rendered}] }${tail}`
  } else {
    throw new Error(
      `Cannot edit features for "${crate}" in ${CARGO_TOML}: ` +
        'the entry is not a single-line version string or inline table.',
    )
  }

  lines[index] = updated
  write(CARGO_TOML, lines.join('\n'))
}

type PackageJson = { dependencies?: Record<string, string> } & Record<string, unknown>

/** Adds a runtime dependency to package.json, keeping the existing key order. */
export function addBunDependency(name: string, version: string): void {
  const pkg = JSON.parse(read(PACKAGE_JSON)) as PackageJson
  const dependencies = pkg.dependencies ?? {}
  if (name in dependencies) return

  const keys = [...Object.keys(dependencies), name].sort()
  const merged: Record<string, string> = {}
  for (const key of keys) {
    merged[key] = key === name ? version : (dependencies[key] as string)
  }
  pkg.dependencies = merged
  write(PACKAGE_JSON, formatJson(PACKAGE_JSON, pkg))
}

type Capability = { permissions?: unknown[] } & Record<string, unknown>

/**
 * Identity of a permission entry. Tauri permissions are keyed by identifier, so
 * an object-form entry and a bare string naming the same permission count as
 * the same entry — that is what keeps the merge idempotent across shapes.
 */
function permissionKey(permission: unknown): string {
  if (typeof permission === 'string') return permission
  if (permission !== null && typeof permission === 'object' && 'identifier' in permission) {
    const { identifier } = permission as { identifier: unknown }
    if (typeof identifier === 'string') return identifier
  }
  return JSON.stringify(permission)
}

/** Merges entries into the `permissions` array, skipping any already present. */
export function addCapabilityPermissions(permissions: unknown[]): void {
  const capability = JSON.parse(read(CAPABILITIES_JSON)) as Capability
  const current = capability.permissions
  if (!Array.isArray(current)) {
    throw new Error(`No "permissions" array in ${CAPABILITIES_JSON}`)
  }

  const seen = new Set(current.map(permissionKey))
  const missing = permissions.filter((permission) => !seen.has(permissionKey(permission)))
  if (missing.length === 0) return

  capability.permissions = [...current, ...missing]
  write(CAPABILITIES_JSON, formatJson(CAPABILITIES_JSON, capability))
}
