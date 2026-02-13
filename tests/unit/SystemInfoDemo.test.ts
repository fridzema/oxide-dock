import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SystemInfoDemo from '../../src/components/SystemInfoDemo.vue'
import {
  type as osType,
  version as osVersion,
  arch as osArch,
  platform as osPlatform,
} from '@tauri-apps/plugin-os'
import { openUrl } from '@tauri-apps/plugin-opener'

vi.mock('@tauri-apps/plugin-os', () => ({
  type: vi.fn(),
  version: vi.fn(),
  arch: vi.fn(),
  platform: vi.fn(),
}))

vi.mock('@tauri-apps/plugin-opener', () => ({
  openUrl: vi.fn(),
}))

describe('SystemInfoDemo', () => {
  beforeEach(() => {
    vi.mocked(osType).mockReturnValue('macos')
    vi.mocked(osVersion).mockReturnValue('24.0.0')
    vi.mocked(osArch).mockReturnValue('aarch64')
    vi.mocked(osPlatform).mockReturnValue('macos')
    vi.mocked(openUrl).mockReset()
  })

  it('renders title and description', () => {
    const wrapper = mount(SystemInfoDemo)
    expect(wrapper.text()).toContain('System Info')
    expect(wrapper.text()).toContain('OS details and open links')
  })

  it('shows no info before mount completes', () => {
    // Before onMounted fires, info is empty array
    const wrapper = mount(SystemInfoDemo)
    // Status element should not be present initially
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('displays OS info on mount', async () => {
    const wrapper = mount(SystemInfoDemo)
    await flushPromises()
    expect(wrapper.text()).toContain('OS Type')
    expect(wrapper.text()).toContain('macos')
    expect(wrapper.text()).toContain('Version')
    expect(wrapper.text()).toContain('24.0.0')
    expect(wrapper.text()).toContain('Architecture')
    expect(wrapper.text()).toContain('aarch64')
  })

  it('shows fallback when OS plugin throws', async () => {
    vi.mocked(osType).mockImplementation(() => {
      throw new Error('not available')
    })
    const wrapper = mount(SystemInfoDemo)
    await flushPromises()
    expect(wrapper.text()).toContain('Requires Tauri runtime')
  })

  it('opens GitHub and shows success', async () => {
    vi.mocked(openUrl).mockResolvedValue(undefined)
    const wrapper = mount(SystemInfoDemo)

    const ghButton = wrapper.findAll('button').find((b) => b.text().includes('Open GitHub'))!
    await ghButton.trigger('click')
    await flushPromises()

    expect(openUrl).toHaveBeenCalledWith('https://github.com/fridzema/oxide-dock')
    expect(wrapper.find('[role="status"]').text()).toBe('Opened in browser!')
    expect(wrapper.find('[role="status"]').classes()).toContain('text-green-500')
  })

  it('shows error when openUrl fails', async () => {
    vi.mocked(openUrl).mockRejectedValue(new Error('Open failed'))
    const wrapper = mount(SystemInfoDemo)

    const ghButton = wrapper.findAll('button').find((b) => b.text().includes('Open GitHub'))!
    await ghButton.trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toBe('Error: Open failed')
    expect(wrapper.find('[role="status"]').classes()).toContain('text-red-500')
  })
})
