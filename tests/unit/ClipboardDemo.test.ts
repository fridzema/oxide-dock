import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ClipboardDemo from '../../src/components/ClipboardDemo.vue'

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
  writeText: vi.fn(),
  readText: vi.fn().mockResolvedValue('clipboard content'),
}))

describe('ClipboardDemo', () => {
  it('renders title and description', () => {
    const wrapper = mount(ClipboardDemo)
    expect(wrapper.text()).toContain('Clipboard')
    expect(wrapper.text()).toContain('Read and write system clipboard')
  })

  it('has a text input with default value', () => {
    const wrapper = mount(ClipboardDemo)
    const input = wrapper.find('input')
    expect(input.element.value).toBe('Hello from Tauri clipboard!')
  })

  it('has copy and read buttons', () => {
    const wrapper = mount(ClipboardDemo)
    const buttons = wrapper.findAll('button')
    expect(buttons.some((b) => b.text() === 'Copy')).toBe(true)
    expect(buttons.some((b) => b.text() === 'Read Clipboard')).toBe(true)
  })
})
