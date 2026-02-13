import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../../src/App.vue'

vi.mock('../../src/composables/useDarkMode', () => ({
  useDarkMode: vi.fn(() => ({
    isDark: { value: false },
    toggleDark: vi.fn(),
  })),
}))

describe('App', () => {
  it('renders DefaultLayout', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          DefaultLayout: { template: '<div data-testid="layout"><slot /></div>' },
        },
      },
    })
    expect(wrapper.find('[data-testid="layout"]').exists()).toBe(true)
  })
})
