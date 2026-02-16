import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useCounterStore } from '../../src/stores/counter'

describe('Counter Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with count 0', () => {
    const store = useCounterStore()
    expect(store.count).toBe(0)
  })

  it('increments the count', () => {
    const store = useCounterStore()
    store.increment()
    expect(store.count).toBe(1)
  })

  it('decrements the count', () => {
    const store = useCounterStore()
    store.decrement()
    expect(store.count).toBe(-1)
  })

  it('resets the count', () => {
    const store = useCounterStore()
    store.increment()
    store.increment()
    store.reset()
    expect(store.count).toBe(0)
  })

  it('computes doubleCount', () => {
    const store = useCounterStore()
    store.increment()
    store.increment()
    store.increment()
    expect(store.doubleCount).toBe(6)
  })
})
