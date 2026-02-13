import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AboutPage from '../../src/pages/AboutPage.vue'

describe('AboutPage', () => {
  it('renders title and description', () => {
    const wrapper = mount(AboutPage)
    expect(wrapper.text()).toContain('About OxideDock')
    expect(wrapper.text()).toContain('desktop application foundation')
    expect(wrapper.text()).toContain('v0.1.0')
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
})
