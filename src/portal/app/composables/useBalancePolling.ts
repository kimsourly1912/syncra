/**
 * Composable that periodically refreshes the token balance.
 * Auto-starts on mount and auto-stops on unmount.
 *
 * @param intervalMs - polling interval in milliseconds (default: 60 000 = 1 min)
 */
export function useBalancePolling(intervalMs = 60_000) {
  const profileStore = useProfileStore()
  const timer = ref<NodeJS.Timeout | null>(null)

  onMounted(() => {
    profileStore.refreshBalance()
    timer.value = setInterval(() => profileStore.refreshBalance(), intervalMs)
  })

  onBeforeUnmount(() => {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
  })
}
