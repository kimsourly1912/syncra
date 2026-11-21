export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server)
    return

  const profileStore = useProfileStore()
  const { isAuthenticated, isMember, partialOnboarded } = storeToRefs(profileStore)

  if (!isAuthenticated.value) {
    return navigateTo({ replace: true, path: toRoute('/auth/sign-in') })
  }

  if (partialOnboarded.value || isMember.value) {
    return navigateTo({ replace: true, path: toRoute('/') })
  }
})
