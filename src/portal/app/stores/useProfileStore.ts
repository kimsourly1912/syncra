import type { ProfileDTO } from '@/types/dto'
import type { AuthStatus } from '@/constants/key'
import * as authService from '@/services/auth.service'
import { getProfile } from '@/services/profile.service'
// import { getBalanceTokens } from '@/services/balancetoken.service'
import { getBalanceTokens } from '@/services/token.service'
import { STATE, STORE_ID, AUTH_STATUS, ASYNC_DATA } from '@/constants/key'
import type { BalanceDto } from '@/types/dto/token'

export const useProfileStore = defineStore(STORE_ID.profile, () => {
  const cookieUsername = useCookie(cookieKey('username'))
  const authStatus = shallowRef<AuthStatus>(AUTH_STATUS.UNKNOWN)

  // Explicit auth status tracking - more reliable than checking data existence
  const isAuthenticated = computed(() => authStatus.value === AUTH_STATUS.AUTHENTICATED)

  const companyId = computed(() => data.value?.companyId ?? -1)
  const isMember = computed(() => data.value?.profileType === 'MEMBER')
  const userRole = computed(() => data.value?.profilePrivilege.role.code ?? '')
  const isAdmin = computed(() => data.value?.profilePrivilege.role.code === 'ADMIN')
  const canExportToErp = computed(() => data.value?.companyFeatures?.erpExport ?? false)
  const onboarded = computed(() => Boolean(data.value?.detailCompleted) && Boolean(data.value?.representCompleted))
  const partialOnboarded = computed(() => Boolean(data.value?.detailCompleted) || Boolean(data.value?.representCompleted))

  function clear() {
    cookieUsername.value = null
    authStatus.value = AUTH_STATUS.UNAUTHENTICATED
    resetBalance()
    clearNuxtState(Object.values(STATE))
  }

  const { execute: onLogout, pending: pendingLogout } = useAsyncData(async () => {
    await authService.logout()
    navigateTo({ replace: true, path: toRoute('/auth/sign-in') })
    clear()
  }, { immediate: false, server: false })

  const { data, execute, pending } = useAsyncData(ASYNC_DATA.profile, async () => {
    const { data } = await getProfile()
    authStatus.value = AUTH_STATUS.AUTHENTICATED
    cookieUsername.value = data.username

    const { data: tokenBalance } = await getBalanceTokens(data.companyId)

    return {
      ...data,
      tokenBalance,
    } satisfies ProfileDTO.ProfileData
  }, { immediate: false, server: false, lazy: true })

  const tokenBalanceData = shallowRef<BalanceDto.Item | null>(null)
  let balanceRevision = 0

  function resetBalance() {
    balanceRevision++
    tokenBalanceData.value = null
  }

  watch(companyId, resetBalance, { flush: 'sync' })

  async function refreshBalance() {
    const requestedCompanyId = companyId.value
    if (requestedCompanyId <= 0) return
    const revision = ++balanceRevision
    try {
      const { data: balanceData } = await getBalanceTokens(requestedCompanyId)
      if (revision === balanceRevision)
        tokenBalanceData.value = balanceData
    }
    catch (e) {
      if (revision === balanceRevision)
        console.warn('Failed to refresh token balance:', e)
    }
  }

  const tokenBalance = computed(() => tokenBalanceData.value ?? data.value?.tokenBalance)

  return {
    data,
    pending,
    userRole,
    isAdmin,
    isMember,
    onboarded,
    companyId,
    authStatus,
    tokenBalance,
    cookieUsername,
    pendingLogout,
    isAuthenticated,
    partialOnboarded,
    canExportToErp,
    clear,
    execute,
    onLogout,
    refreshBalance,
  }
})
