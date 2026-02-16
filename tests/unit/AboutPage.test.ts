import { getVersion } from '@tauri-apps/api/app'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AboutPage from '../../src/pages/AboutPage.vue'

vi.mock('@tauri-apps/api/app', () => ({
  getVersion: vi.fn().mockResolvedValue('1.2.3'),
}))

describe('AboutPage', () => {
  beforeEach(() => {
    vi.mocked(getVersion).mockResolvedValue('1.2.3')
  })
  it('renders title and description', async () => {
    const wrapper = mount(AboutPage)
    await flushPromises()
    expect(wrapper.text()).toContain('About OxideDock')
    expect(wrapper.text()).toContain('desktop application foundation')
    expect(wrapper.text()).toContain('v1.2.3')
  })

  it('renders all 7 tech stack items', () => {
    const wrapper = mount(AboutPage)
    const links = wrapper.findAll('a')
    expect(links).toHaveLength(7)
  })

  it('displays tech names and descriptions', () => {
    const wrapper = mount(AboutPage)
    expect(wrapper.text()).toContain('Tauri')
    expect(wrapper.text()).toContain('Desktop runtime')
    expect(wrapper.text()).toContain('Vue')
    expect(wrapper.text()).toContain('Frontend framework')
  })

  it('has correct link attributes', () => {
    const wrapper = mount(AboutPage)
    const link = wrapper.find('a')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(link.attributes('href')).toContain('https://')
  })

  it('shows unknown version when getVersion fails', async () => {
    vi.mocked(getVersion).mockRejectedValueOnce(new Error('not available'))
    const wrapper = mount(AboutPage)
    await flushPromises()
    expect(wrapper.text()).toContain('vunknown')
  })
})
