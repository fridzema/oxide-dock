import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
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
