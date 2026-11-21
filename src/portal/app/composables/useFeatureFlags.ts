export function useFeatureFlags() {
  const config = useRuntimeConfig()

  const hideSocialLogin = computed(() => config.public.hideSocialLogin)
  const hidePhoneSignUp = computed(() => config.public.hidePhoneSignUp)

  return {
    hideSocialLogin,
    hidePhoneSignUp,
  }
}
