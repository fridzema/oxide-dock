import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FileDialogDemo from '../../src/components/FileDialogDemo.vue'

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(),
}))

describe('FileDialogDemo', () => {
  beforeEach(() => {
    vi.mocked(open).mockReset()
    vi.mocked(readTextFile).mockReset()
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
    vi.mocked(readTextFile).mockResolvedValue('Hello world')
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
    vi.mocked(readTextFile).mockResolvedValue(longContent)
    const wrapper = mount(FileDialogDemo)

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('truncated')
  })

  it('shows path but no content for empty file', async () => {
    vi.mocked(open).mockResolvedValue('/path/to/empty.txt')
    vi.mocked(readTextFile).mockResolvedValue('')
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

    expect(readTextFile).not.toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('Path:')
  })

  it('shows error when readTextFile throws', async () => {
    vi.mocked(open).mockResolvedValue('/path/to/file.txt')
    vi.mocked(readTextFile).mockRejectedValue(new Error('Permission denied'))
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

  it('falls back to String(e) when error has no message property', async () => {
    vi.mocked(open).mockResolvedValue('/path/to/file.txt')
    vi.mocked(readTextFile).mockRejectedValue('raw string error')
    const wrapper = mount(FileDialogDemo)

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('raw string error')
  })
})
