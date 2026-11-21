export default defineNuxtPlugin((_) => {
  const { public: { apiURL } } = useRuntimeConfig()

  // fetch instace provide only essential option
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
