export default defineNuxtRouteMiddleware(() => {
  if (IS_SERVER) return
  const { isAuthenticated } = useAuth()

  if (isAuthenticated.value) {
    return navigateTo(toRoute('/'))
  }
})
