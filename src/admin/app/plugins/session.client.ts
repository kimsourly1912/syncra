import type { $Fetch } from 'ofetch'
import { configureApi } from '@/api'
import { renewSession, useSession, useSessionSync } from '@/features/session'

// Connects the API client to the staff session. The only plugin: the route guard
// (middleware/access.global.ts) loads the session when the first page needs it.
export default defineNuxtPlugin({
  name: 'session',
  setup() {
    const { public: { apiURL, apiProxyPath } } = useRuntimeConfig()
    const session = useSession()

    configureApi({
      fetch: $fetch.create({
        // apiProxyPath is only set in `nuxt dev` (see nuxt.config.ts)
        baseURL: apiProxyPath || apiURL,
        credentials: 'include',
        // The client retries a 401 once after renewing the session. Nothing else is retried,
        // so a write is never sent twice behind the caller's back.
        retry: false,
      }) as $Fetch,
      renew: renewSession,
      onExpired: () => session.end('expired'),
    })

    useSessionSync()
  },
})
