export default defineNuxtPlugin((_) => {
  const { public: { apiURL } } = useRuntimeConfig()

  // create an instance for fetching
  const api = $fetch.create({
    baseURL: apiURL,
  })

  return {
    provide: {
      api,
    },
  }
})
