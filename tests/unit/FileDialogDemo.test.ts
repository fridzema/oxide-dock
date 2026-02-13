import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FileDialogDemo from '../../src/components/FileDialogDemo.vue'

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn().mockResolvedValue(null),
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn().mockResolvedValue('file content'),
}))

describe('FileDialogDemo', () => {
  it('renders title and description', () => {
    const wrapper = mount(FileDialogDemo)
    expect(wrapper.text()).toContain('File Dialog')
    expect(wrapper.text()).toContain('Open files with native dialogs')
  })

  it('has an open file button', () => {
    const wrapper = mount(FileDialogDemo)
    const button = wrapper.find('button')
    expect(button.text()).toBe('Open File')
  })

  it('does not show file info initially', () => {
    const wrapper = mount(FileDialogDemo)
    expect(wrapper.text()).not.toContain('Path:')
  })
})
