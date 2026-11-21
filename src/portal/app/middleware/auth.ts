const { getRoutes } = usePermission()

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server)
    return

  const profileStore = useProfileStore()
  const { isAuthenticated, userRole } = storeToRefs(profileStore)

  if (!isAuthenticated.value) {
    return navigateTo({ replace: true, path: toRoute('/auth/sign-in') })
  }

  const protectedRoutes = getRoutes(userRole.value)

  if (protectedRoutes.includes('all')) return

  if (!protectedRoutes.includes(to.path)) {
    return navigateTo(toRoute(protectedRoutes[0] ?? '/'))
  }
})
