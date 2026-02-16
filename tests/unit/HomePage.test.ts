import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import HomePage from '../../src/pages/HomePage.vue'
import { useCounterStore } from '../../src/stores/counter'

const componentStubs = {
  NotificationDemo: { template: '<div data-testid="notification-demo" />' },
  ClipboardDemo: { template: '<div data-testid="clipboard-demo" />' },
  FileDialogDemo: { template: '<div data-testid="filedialog-demo" />' },
  SystemInfoDemo: { template: '<div data-testid="systeminfo-demo" />' },
}

describe('HomePage', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountPage() {
    return mount(HomePage, {
      global: {
        plugins: [pinia],
        stubs: componentStubs,
      },
    })
  }

  it('renders hero section', () => {
    const wrapper = mountPage()
    expect(wrapper.text()).toContain('OxideDock')
    expect(wrapper.text()).toContain('Raw speed, refined desktop')
  })

  it('displays counter value and doubleCount', () => {
    const wrapper = mountPage()
    const store = useCounterStore()
    expect(wrapper.text()).toContain(String(store.count))
    expect(wrapper.text()).toContain(`Double: ${store.doubleCount}`)
  })

  it('increments counter on + click', async () => {
    const wrapper = mountPage()
    const store = useCounterStore()
    await wrapper.find('[aria-label="Increment counter"]').trigger('click')
    expect(store.count).toBe(1)
  })

  it('decrements counter on - click', async () => {
    const wrapper = mountPage()
    const store = useCounterStore()
    await wrapper.find('[aria-label="Decrement counter"]').trigger('click')
    expect(store.count).toBe(-1)
  })

  it('resets counter', async () => {
    const wrapper = mountPage()
    const store = useCounterStore()
    store.increment()
    store.increment()
    // Find the Reset button by text
    const resetBtn = wrapper.findAll('button').find((b) => b.text() === 'Reset')!
    await resetBtn.trigger('click')
    expect(store.count).toBe(0)
  })

  it('renders all tech stack pills', () => {
    const wrapper = mountPage()
    const techs = ['Tauri v2', 'Vue 3', 'TypeScript', 'Tailwind CSS v4', 'Pinia', 'Tauri Plugins']
    for (const tech of techs) {
      expect(wrapper.text()).toContain(tech)
    }
  })

  it('renders all demo component stubs', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-testid="notification-demo"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="clipboard-demo"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="filedialog-demo"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="systeminfo-demo"]').exists()).toBe(true)
  })
})
