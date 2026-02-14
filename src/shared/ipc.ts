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

// Known Tauri command names — must match handlers in src-tauri/src/handlers.rs
export type CommandName = 'greet' | 'greet_checked' | 'get_app_info'

// Type-safe invoke wrapper
export async function invokeCommand<TRes>(
  cmd: CommandName,
  args?: Record<string, unknown>,
): Promise<TRes> {
  return invoke<TRes>(cmd, args)
}

// Pre-typed command functions
export const commands = {
  greet: (req: GreetRequest) => invokeCommand<string>('greet', req),
  greetChecked: (req: GreetRequest) => invokeCommand<string>('greet_checked', req),
  getAppInfo: () => invokeCommand<AppInfo>('get_app_info'),
} as const
