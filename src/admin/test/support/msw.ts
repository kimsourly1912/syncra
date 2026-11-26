import { createFetch } from 'ofetch'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { configureApi } from '@/api'
import { createMswHandlers } from '@/api/generated/msw.gen'

/** The base URL the client calls in these tests; nothing listens there, MSW answers. */
const API = 'http://api.test.invalid'

/**
 * Network-level fakes from the spec (pilot, decision 0021). Unlike `fakeApi`, which replaces the
 * transport, the real `$fetch` sends the request and MSW answers it, so headers, status codes, and
 * bodies go through ofetch as they would in the browser. A request no handler answers fails the
 * test.
 *
 * Handlers are generated per operation (`pnpm --filter admin api:gen`) and typed by the spec,
 * envelope included. Their names follow the backend's operationIds (`getPackages1`), which can
 * change when the backend changes, so look them up by their JSDoc (`GET /admin/credits/packages`).
 *
 * @example
 * const api = useMswApi()
 * api.server.use(api.handlers.getPackages1({ body: ok(packages) }))
 */
export function useMswApi() {
  const server = setupServer()
  const handlers = createMswHandlers({ baseUrl: API }).pick

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  beforeEach(() => {
    configureApi({
      // `fetch` is looked up per request: Nuxt's $fetch kept the global fetch from before MSW
      // replaced it in `listen()`, so its requests would skip MSW and reach the network.
      fetch: createFetch({ fetch: (input, init) => globalThis.fetch(input, init) })
        .create({ baseURL: API, credentials: 'include', retry: false }),
      renew: async () => {},
      onExpired: () => {},
    })
  })
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  return { server, handlers }
}
