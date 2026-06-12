import { invoke } from '@tauri-apps/api/core'

// Structured error from Rust AppError serialization
export type AppError = {
  code: 'VALIDATION' | 'INTERNAL'
  message: string
}

// Command payload types — mirror Rust command signatures
export type GreetRequest = {
  name: string
}

// Response types — mirror Rust response structs
export type AppInfo = {
  name: string
  visit_count: number
}

// Command name → result type — must match handlers in src-tauri/src/handlers.rs
export type CommandResults = {
  greet: string
  greet_checked: string
  get_app_info: AppInfo
}

export type CommandName = keyof CommandResults

// Type-safe invoke wrapper: the result type is derived from the command name
export async function invokeCommand<C extends CommandName>(
  cmd: C,
  args?: Record<string, unknown>,
): Promise<CommandResults[C]> {
  return invoke<CommandResults[C]>(cmd, args)
}

// Pre-typed command functions
export const commands = {
  greet: (req: GreetRequest) => invokeCommand('greet', req),
  greetChecked: (req: GreetRequest) => invokeCommand('greet_checked', req),
  getAppInfo: () => invokeCommand('get_app_info'),
} as const

// Narrows unknown rejection values to the structured AppError shape
export function isAppError(e: unknown): e is AppError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    'message' in e &&
    typeof (e as { message: unknown }).message === 'string'
  )
}

// Human-readable message from any rejection value: structured AppError objects
// from Rust commands, Error instances, or plain string rejections from plugins
export function formatError(e: unknown): string {
  if (isAppError(e)) return e.message
  if (e instanceof Error) return e.message
  return String(e)
}
