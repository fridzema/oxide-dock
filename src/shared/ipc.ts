import { invoke } from '@tauri-apps/api/core'

// Structured error from Rust AppError serialization
export interface AppError {
  code: string
  message: string
}

// Command payload types — mirror Rust command signatures
export interface GreetRequest {
  name: string
}

// Response types — mirror Rust response structs
export interface AppInfo {
  name: string
  visit_count: number
}

export interface ReadFileResult {
  path: string
  content: string
  size_bytes: number
}

// Type-safe invoke wrapper
export async function invokeCommand<TRes>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<TRes> {
  return invoke<TRes>(cmd, args)
}

// Pre-typed command functions
export const commands = {
  greet: (req: GreetRequest) => invokeCommand<string>('greet', req),
  greetChecked: (req: GreetRequest) => invokeCommand<string>('greet_checked', req),
  getAppInfo: () => invokeCommand<AppInfo>('get_app_info'),
  readTextFile: (path: string) => invokeCommand<ReadFileResult>('read_text_file', { path }),
} as const
