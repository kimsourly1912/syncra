export default defineNuxtPlugin((_) => {
  const { public: { apiURL, apiProxyPath } } = useRuntimeConfig()

  // fetch instace provide only essential option
  const api = $fetch.create({
    // apiProxyPath is only set in `nuxt dev` (see nuxt.config.ts)
    baseURL: apiProxyPath || apiURL,
    credentials: 'include',
  })

  return {
    provide: {
      api,
    },
  }
})
