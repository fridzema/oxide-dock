import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { useDarkMode } from '../../src/composables/useDarkMode'
import DefaultLayout from '../../src/layouts/DefaultLayout.vue'

vi.mock('../../src/composables/useDarkMode', () => ({
  useDarkMode: vi.fn(),
}))

const routerStubs = {
  RouterLink: {
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  },
  RouterView: defineComponent({
    setup(_, { slots }) {
      const StubComponent = defineComponent({
        render: () => h('div', { 'data-testid': 'route-component' }),
      })
      return () =>
        h('div', { 'data-testid': 'router-view' }, slots.default?.({ Component: StubComponent }))
    },
  }),
}

describe('DefaultLayout', () => {
  beforeEach(() => {
    vi.mocked(useDarkMode).mockReturnValue({
      isDark: ref(false),
      toggleDark: vi.fn(),
    })
  })

  it('renders nav with logo and links', () => {
    const wrapper = mount(DefaultLayout, { global: { stubs: routerStubs } })
    expect(wrapper.text()).toContain('OxideDock')
    expect(wrapper.find('a[href="/about"]').text()).toBe('About')
  })

  it('renders router view', () => {
    const wrapper = mount(DefaultLayout, { global: { stubs: routerStubs } })
    expect(wrapper.find('[data-testid="router-view"]').exists()).toBe(true)
  })

  it('shows moon icon and correct aria-label in light mode', () => {
    vi.mocked(useDarkMode).mockReturnValue({
      isDark: ref(false),
      toggleDark: vi.fn(),
    })
    const wrapper = mount(DefaultLayout, { global: { stubs: routerStubs } })
    const button = wrapper.find('button')
    expect(button.attributes('aria-label')).toBe('Switch to dark mode')
    // Moon icon path contains M21.752
    expect(wrapper.find('button svg path').attributes('d')).toContain('M21.752')
  })

  it('shows sun icon and correct aria-label in dark mode', () => {
    vi.mocked(useDarkMode).mockReturnValue({
      isDark: ref(true),
      toggleDark: vi.fn(),
    })
    const wrapper = mount(DefaultLayout, { global: { stubs: routerStubs } })
    const button = wrapper.find('button')
    expect(button.attributes('aria-label')).toBe('Switch to light mode')
    // Sun icon path contains M12 3v2.25
    expect(wrapper.find('button svg path').attributes('d')).toContain('M12 3v2.25')
  })

  it('calls toggleDark when button is clicked', async () => {
    const toggleDark = vi.fn()
    vi.mocked(useDarkMode).mockReturnValue({
      isDark: ref(false),
      toggleDark,
    })
    const wrapper = mount(DefaultLayout, { global: { stubs: routerStubs } })
    await wrapper.find('button').trigger('click')
    expect(toggleDark).toHaveBeenCalled()
  })
})
