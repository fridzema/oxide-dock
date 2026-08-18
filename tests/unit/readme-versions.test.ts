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

// Only the Tech Stack table is authoritative for versions; other README tables must not be matched.
function techStackSection(): string[] {
  const lines = readme.split('\n')
  const start = lines.findIndex((line) => line.trim() === '## Tech Stack')
  if (start === -1) throw new Error('README.md has no "## Tech Stack" heading')
  const body = lines.slice(start + 1)
  const end = body.findIndex((line) => line.startsWith('## '))
  return end === -1 ? body : body.slice(0, end)
}

function documentedVersion(label: string): string | undefined {
  const row = techStackSection()
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
