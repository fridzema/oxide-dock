import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

function read(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

// Commands wired into the Tauri runtime via tauri::generate_handler!.
function registeredCommands(): string[] {
  const source = read('src-tauri/src/lib.rs')
  const block = source.match(/generate_handler!\[([^\]]*)\]/)
  if (!block) throw new Error('src-tauri/src/lib.rs has no generate_handler! invocation')
  return block[1]
    .split(',')
    .map((entry) => entry.trim().replace(/^.*::/, ''))
    .filter((entry) => entry.length > 0)
    .sort()
}

// Functions annotated #[tauri::command]. Tolerates further attributes before the fn.
function definedCommands(): string[] {
  const source = read('src-tauri/src/handlers.rs')
  const chunks = source.split('#[tauri::command]').slice(1)
  if (chunks.length === 0) {
    throw new Error('src-tauri/src/handlers.rs has no #[tauri::command] functions')
  }
  return chunks
    .map((chunk) => {
      const fn = chunk.match(/pub\s+(?:async\s+)?fn\s+(\w+)/)
      if (!fn) throw new Error('a #[tauri::command] attribute is not followed by a pub fn')
      return fn[1]
    })
    .sort()
}

// Keys of the CommandResults map, which is the TypeScript view of the command surface.
function declaredCommands(): string[] {
  const source = read('src/shared/ipc.ts')
  const block = source.match(/export type CommandResults = \{([^}]*)\}/)
  if (!block) throw new Error('src/shared/ipc.ts has no CommandResults type')
  return block[1]
    .split('\n')
    .map((line) => line.match(/^\s*(\w+)\s*:/)?.[1])
    .filter((name): name is string => name !== undefined)
    .sort()
}

describe('Tauri command surface', () => {
  it('finds commands in all three sources', () => {
    expect(registeredCommands().length).toBeGreaterThan(0)
    expect(definedCommands().length).toBeGreaterThan(0)
    expect(declaredCommands().length).toBeGreaterThan(0)
  })

  it('registers exactly the commands handlers.rs defines', () => {
    expect(registeredCommands()).toEqual(definedCommands())
  })

  it('declares in TypeScript exactly the commands Rust registers', () => {
    expect(declaredCommands()).toEqual(registeredCommands())
  })
})
