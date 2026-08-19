import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatJson } from '../../recipes/_lib/apply'

// Regression guard for a data-loss bug: `formatJson` used to return whatever
// the formatter printed and the caller wrote that straight to a tracked file.
// A binary that exits 0 and prints nothing therefore truncated package.json and
// capabilities/default.json to zero bytes, with the recipe still exiting 0.
// `formatJson` must only ever return a string it has confirmed parses as JSON.

const VALUE = { name: 'oxidedock', dependencies: { vue: '^3.5.41' } }

const BROKEN_FORMATTERS: Record<string, (filePath: string, input: string) => string> = {
  'prints nothing': () => '',
  'prints whitespace': () => '\n',
  'prints non-JSON': () => 'Version: 0.3.3\n',
  'prints truncated JSON': () => '{"name": "oxide',
  throws: () => {
    throw new Error('biome not found')
  },
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('formatJson', () => {
  for (const [description, format] of Object.entries(BROKEN_FORMATTERS)) {
    it(`falls back to valid JSON when the formatter ${description}`, () => {
      vi.spyOn(console, 'log').mockImplementation(() => {})
      const result = formatJson('package.json', VALUE, format)

      expect(result).not.toBe('')
      expect(JSON.parse(result)).toEqual(VALUE)
    })

    it(`tells the user to run the formatter when the formatter ${description}`, () => {
      const logged = vi.spyOn(console, 'log').mockImplementation(() => {})
      formatJson('package.json', VALUE, format)

      expect(logged.mock.calls.flat().join('\n')).toContain('bun run format')
    })
  }

  it('keeps formatter output that is valid JSON', () => {
    const formatted = '{ "name": "oxidedock", "dependencies": { "vue": "^3.5.41" } }\n'
    expect(formatJson('package.json', VALUE, () => formatted)).toBe(formatted)
  })

  it('returns parseable JSON through the real Biome formatter', () => {
    const result = formatJson('package.json', VALUE)

    expect(result).not.toBe('')
    expect(JSON.parse(result)).toEqual(VALUE)
  })
})
