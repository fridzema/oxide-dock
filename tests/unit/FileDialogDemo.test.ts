import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import FileDialogDemo from '../../src/components/FileDialogDemo.vue'
import { open } from '@tauri-apps/plugin-dialog'
import { commands } from '../../src/shared/ipc'

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}))

vi.mock('../../src/shared/ipc', () => ({
  commands: {
    readTextFile: vi.fn(),
  },
}))

describe('FileDialogDemo', () => {
  beforeEach(() => {
    vi.mocked(open).mockReset()
    vi.mocked(commands.readTextFile).mockReset()
  })

  it('renders title and description', () => {
    const wrapper = mount(FileDialogDemo)
    expect(wrapper.text()).toContain('File Dialog')
    expect(wrapper.text()).toContain('Open files with native dialogs')
  })

  it('has an open file button', () => {
    const wrapper = mount(FileDialogDemo)
    expect(wrapper.find('button').text()).toBe('Open File')
  })

  it('does not show file info initially', () => {
    const wrapper = mount(FileDialogDemo)
    expect(wrapper.text()).not.toContain('Path:')
    expect(wrapper.text()).not.toContain('Size:')
  })

  it('opens file and shows content with metadata', async () => {
    vi.mocked(open).mockResolvedValue('/path/to/file.txt')
    vi.mocked(commands.readTextFile).mockResolvedValue({
      path: '/path/to/file.txt',
      content: 'Hello world',
      size_bytes: 11,
    })
    const wrapper = mount(FileDialogDemo)

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Path:')
    expect(wrapper.text()).toContain('/path/to/file.txt')
    expect(wrapper.text()).toContain('Size:')
    expect(wrapper.text()).toContain('11 B')
    expect(wrapper.text()).toContain('Hello world')
    expect(wrapper.text()).toContain('File opened!')
  })

  it('truncates content longer than 10KB', async () => {
    const longContent = 'x'.repeat(20000)
    vi.mocked(open).mockResolvedValue('/path/to/big.txt')
    vi.mocked(commands.readTextFile).mockResolvedValue({
      path: '/path/to/big.txt',
      content: longContent,
      size_bytes: 20000,
    })
    const wrapper = mount(FileDialogDemo)

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('truncated')
  })

  it('shows path but no content for empty file', async () => {
    vi.mocked(open).mockResolvedValue('/path/to/empty.txt')
    vi.mocked(commands.readTextFile).mockResolvedValue({
      path: '/path/to/empty.txt',
      content: '',
      size_bytes: 0,
    })
    const wrapper = mount(FileDialogDemo)

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('/path/to/empty.txt')
    expect(wrapper.text()).toContain('0 B')
    expect(wrapper.find('pre').exists()).toBe(false)
  })

  it('does nothing when dialog is cancelled', async () => {
    vi.mocked(open).mockResolvedValue(null)
    const wrapper = mount(FileDialogDemo)

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(commands.readTextFile).not.toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('Path:')
  })

  it('shows error when command throws', async () => {
    vi.mocked(open).mockResolvedValue('/path/to/file.txt')
    vi.mocked(commands.readTextFile).mockRejectedValue({
      code: 'FILE_SYSTEM',
      message: 'Permission denied',
    })
    const wrapper = mount(FileDialogDemo)

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Permission denied')
  })

  it('shows error when dialog throws', async () => {
    vi.mocked(open).mockRejectedValue(new Error('Dialog failed'))
    const wrapper = mount(FileDialogDemo)

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Dialog failed')
  })

  it('does not mutate the IPC response object when truncating', async () => {
    const longContent = 'x'.repeat(20000)
    const response = {
      path: '/path/to/big.txt',
      content: longContent,
      size_bytes: 20000,
    }
    vi.mocked(open).mockResolvedValue('/path/to/big.txt')
    vi.mocked(commands.readTextFile).mockResolvedValue(response)
    const wrapper = mount(FileDialogDemo)

    await wrapper.find('button').trigger('click')
    await flushPromises()

    // Original response object should be unmodified
    expect(response.content).toHaveLength(20000)
    expect(wrapper.text()).toContain('truncated')
  })

  it('falls back to String(e) when error has no message', async () => {
    vi.mocked(open).mockResolvedValue('/path/to/file.txt')
    vi.mocked(commands.readTextFile).mockRejectedValue('raw string error')
    const wrapper = mount(FileDialogDemo)

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('raw string error')
  })
})
