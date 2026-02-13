import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NotFound from '../../src/pages/NotFoundPage.vue'

describe('NotFound', () => {
  it('renders 404 message', () => {
    const wrapper = mount(NotFound, {
      global: {
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    })
    expect(wrapper.text()).toContain('Page not found')
  })

  it('has a link back to home', () => {
    const wrapper = mount(NotFound, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })
    const link = wrapper.find('a')
    expect(link.attributes('href')).toBe('/')
  })
})
