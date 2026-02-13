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
} as const
