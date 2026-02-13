import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ClipboardDemo from '../../src/components/ClipboardDemo.vue'
import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager'

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
  writeText: vi.fn(),
  readText: vi.fn(),
}))

describe('ClipboardDemo', () => {
  beforeEach(() => {
    vi.mocked(writeText).mockReset()
    vi.mocked(readText).mockReset()
  })

  it('renders title and description', () => {
    const wrapper = mount(ClipboardDemo)
    expect(wrapper.text()).toContain('Clipboard')
    expect(wrapper.text()).toContain('Read and write system clipboard')
  })

  it('has a text input with default value', () => {
    const wrapper = mount(ClipboardDemo)
    expect(wrapper.find('input').element.value).toBe('Hello from Tauri clipboard!')
  })

  it('has copy and read buttons', () => {
    const wrapper = mount(ClipboardDemo)
    const buttons = wrapper.findAll('button')
    expect(buttons.some((b) => b.text() === 'Copy')).toBe(true)
    expect(buttons.some((b) => b.text() === 'Read Clipboard')).toBe(true)
  })

  it('copies text and shows success', async () => {
    vi.mocked(writeText).mockResolvedValue(undefined)
    const wrapper = mount(ClipboardDemo)

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Copy')!
      .trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith('Hello from Tauri clipboard!')
    expect(wrapper.find('[role="status"]').text()).toBe('Copied!')
  })

  it('copies updated text', async () => {
    vi.mocked(writeText).mockResolvedValue(undefined)
    const wrapper = mount(ClipboardDemo)

    await wrapper.find('input').setValue('New text')
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Copy')!
      .trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith('New text')
  })

  it('shows error when copy fails', async () => {
    vi.mocked(writeText).mockRejectedValue(new Error('Copy failed'))
    const wrapper = mount(ClipboardDemo)

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Copy')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toBe('Error: Copy failed')
    expect(wrapper.find('[role="status"]').classes()).toContain('text-red-500')
  })

  it('reads clipboard content', async () => {
    vi.mocked(readText).mockResolvedValue('clipboard content')
    const wrapper = mount(ClipboardDemo)

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Read Clipboard')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('clipboard content')
  })

  it('shows (empty) when clipboard is empty', async () => {
    vi.mocked(readText).mockResolvedValue('')
    const wrapper = mount(ClipboardDemo)

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Read Clipboard')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('(empty)')
  })

  it('shows error when read fails', async () => {
    vi.mocked(readText).mockRejectedValue(new Error('Read failed'))
    const wrapper = mount(ClipboardDemo)

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Read Clipboard')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toBe('Error: Read failed')
  })

  it('clears status after successful read', async () => {
    vi.mocked(writeText).mockResolvedValue(undefined)
    vi.mocked(readText).mockResolvedValue('text')
    const wrapper = mount(ClipboardDemo)

    // First copy to set status
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Copy')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)

    // Then read - should clear status
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Read Clipboard')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.findAll('[role="status"]')).toHaveLength(0)
  })
})
