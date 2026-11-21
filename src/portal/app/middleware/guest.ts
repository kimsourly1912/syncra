export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server)
    return

  const profileStore = useProfileStore()
  const { isAuthenticated } = storeToRefs(profileStore)

  if (isAuthenticated.value) {
    return navigateTo({ replace: true, path: toRoute('/') })
  }

  const { password } = useAppState()
  const isVerifyPath = to.path.includes(toRoute('/auth/verify'))

  if (isVerifyPath && !password.value) {
    return navigateTo({ replace: true, path: toRoute('/auth/sign-in') })
  }
})
