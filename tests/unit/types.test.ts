import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expectTypeOf, it } from 'vitest'
import type { Router } from 'vue-router'
import { useCounterStore } from '../../src/stores/counter'

describe('type tests', () => {
  describe('counter store', () => {
    beforeEach(() => {
      setActivePinia(createPinia())
    })

    it('has correctly typed state', () => {
      const store = useCounterStore()
      expectTypeOf(store.count).toBeNumber()
      expectTypeOf(store.doubleCount).toBeNumber()
    })

    it('has correctly typed actions', () => {
      const store = useCounterStore()
      expectTypeOf(store.increment).toMatchTypeOf<() => void>()
      expectTypeOf(store.decrement).toMatchTypeOf<() => void>()
      expectTypeOf(store.reset).toMatchTypeOf<() => void>()
    })
  })

  describe('useDarkMode', () => {
    it('has correctly typed return', () => {
      // Use type-only assertion via ReturnType
      type UseDarkMode = typeof import('../../src/composables/useDarkMode').useDarkMode
      type Result = ReturnType<UseDarkMode>
      expectTypeOf<Result>().toHaveProperty('isDark')
      expectTypeOf<Result>().toHaveProperty('toggleDark')
    })
  })

  describe('router', () => {
    it('exports a Router instance', () => {
      type RouterDefault = typeof import('../../src/router/index').default
      expectTypeOf<RouterDefault>().toMatchTypeOf<Router>()
    })
  })
})
