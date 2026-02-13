import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SystemInfoDemo from '../../src/components/SystemInfoDemo.vue'

vi.mock('@tauri-apps/plugin-os', () => ({
  type: vi.fn().mockReturnValue('macos'),
  version: vi.fn().mockReturnValue('24.0.0'),
  arch: vi.fn().mockReturnValue('aarch64'),
  platform: vi.fn().mockReturnValue('macos'),
}))

vi.mock('@tauri-apps/plugin-opener', () => ({
  openUrl: vi.fn(),
}))

describe('SystemInfoDemo', () => {
  it('renders title and description', () => {
    const wrapper = mount(SystemInfoDemo)
    expect(wrapper.text()).toContain('System Info')
    expect(wrapper.text()).toContain('OS details and open links')
  })

  it('has an open github button', () => {
    const wrapper = mount(SystemInfoDemo)
    const buttons = wrapper.findAll('button')
    expect(buttons.some((b) => b.text().includes('Open GitHub Repo'))).toBe(true)
  })
})
