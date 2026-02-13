import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { commands, invokeCommand } from '../../src/shared/ipc'
import type { AppError } from '../../src/shared/ipc'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

describe('invokeCommand', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset()
  })

  it('forwards to tauri invoke with correct args', async () => {
    vi.mocked(invoke).mockResolvedValue('result')
    const result = await invokeCommand<string>('test_cmd', { key: 'value' })
    expect(invoke).toHaveBeenCalledWith('test_cmd', { key: 'value' })
    expect(result).toBe('result')
  })

  it('propagates errors from invoke', async () => {
    vi.mocked(invoke).mockRejectedValue({ code: 'VALIDATION', message: 'bad input' })
    await expect(invokeCommand<string>('test_cmd')).rejects.toEqual({
      code: 'VALIDATION',
      message: 'bad input',
    })
  })
})

describe('commands.greet', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset()
  })

  it('calls greet command with name', async () => {
    vi.mocked(invoke).mockResolvedValue('Hello, World!')
    const result = await commands.greet({ name: 'World' })
    expect(invoke).toHaveBeenCalledWith('greet', { name: 'World' })
    expect(result).toBe('Hello, World!')
  })
})

describe('commands.greetChecked', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset()
  })

  it('calls greet_checked command with name', async () => {
    vi.mocked(invoke).mockResolvedValue('Hello, Test!')
    const result = await commands.greetChecked({ name: 'Test' })
    expect(invoke).toHaveBeenCalledWith('greet_checked', { name: 'Test' })
    expect(result).toBe('Hello, Test!')
  })

  it('rejects with structured AppError on failure', async () => {
    const error: AppError = { code: 'VALIDATION', message: 'Name cannot be empty' }
    vi.mocked(invoke).mockRejectedValue(error)
    await expect(commands.greetChecked({ name: '' })).rejects.toEqual(error)
  })
})

describe('commands.getAppInfo', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset()
  })

  it('calls get_app_info with no args', async () => {
    const mockInfo = { name: 'OxideDock', visit_count: 1 }
    vi.mocked(invoke).mockResolvedValue(mockInfo)
    const result = await commands.getAppInfo()
    expect(invoke).toHaveBeenCalledWith('get_app_info', undefined)
    expect(result).toEqual(mockInfo)
  })
})

describe('commands.readTextFile', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset()
  })

  it('calls read_text_file with path', async () => {
    const mockResult = { path: '/test.txt', content: 'hello', size_bytes: 5 }
    vi.mocked(invoke).mockResolvedValue(mockResult)
    const result = await commands.readTextFile('/test.txt')
    expect(invoke).toHaveBeenCalledWith('read_text_file', { path: '/test.txt' })
    expect(result).toEqual(mockResult)
  })

  it('rejects with FILE_SYSTEM error for missing files', async () => {
    const error: AppError = { code: 'FILE_SYSTEM', message: 'not found' }
    vi.mocked(invoke).mockRejectedValue(error)
    await expect(commands.readTextFile('/missing.txt')).rejects.toEqual(error)
  })
})

describe('AppError type', () => {
  it('has the expected shape', () => {
    const error: AppError = { code: 'FILE_SYSTEM', message: 'not found' }
    expect(error.code).toBe('FILE_SYSTEM')
    expect(error.message).toBe('not found')
  })
})
