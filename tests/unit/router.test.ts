import { describe, it, expect } from 'vitest'
import router from '../../src/router'

describe('router', () => {
  it('defines 3 routes', () => {
    const routes = router.options.routes
    expect(routes).toHaveLength(3)
  })

  it('has home route at /', () => {
    const home = router.options.routes[0]
    expect(home.path).toBe('/')
    expect(home.name).toBe('home')
    expect(typeof home.component).toBe('function')
  })

  it('has about route at /about', () => {
    const about = router.options.routes[1]
    expect(about.path).toBe('/about')
    expect(about.name).toBe('about')
    expect(typeof about.component).toBe('function')
  })

  it('has catch-all not-found route', () => {
    const notFound = router.options.routes[2]
    expect(notFound.path).toBe('/:pathMatch(.*)*')
    expect(notFound.name).toBe('not-found')
    expect(typeof notFound.component).toBe('function')
  })

  it('lazy loads all route components', async () => {
    for (const route of router.options.routes) {
      if (typeof route.component === 'function') {
        const mod = await (route.component as () => Promise<unknown>)()
        expect(mod).toBeDefined()
      }
    }
  })
})
