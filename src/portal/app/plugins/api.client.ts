export default defineNuxtPlugin((_) => {
  const { public: { apiURL } } = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: apiURL,
    credentials: 'include',
  })

  return {
    provide: {
      api,
    },
  }
})
