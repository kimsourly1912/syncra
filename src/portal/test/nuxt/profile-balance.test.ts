import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createPinia } from 'pinia'
import { ref } from 'vue'
import { useProfileStore } from '../../app/stores/useProfileStore'

const api = vi.hoisted(() => vi.fn())
const profile = ref({ companyId: 42, tokenBalance: { balance: 100 } })

mockNuxtImport('useAPI', () => api)
mockNuxtImport('useAsyncData', () => () => ({
  data: profile, execute: vi.fn(), pending: ref(false),
}))
mockNuxtImport('useCookie', () => () => ref(null))

function pendingBalance() {
  let resolve!: (balance: number) => void
  api.mockImplementationOnce(() => new Promise((complete) => {
    resolve = balance => complete({ data: { balance } })
  }))
  return (balance: number) => resolve(balance)
}

beforeEach(() => {
  api.mockReset()
  profile.value = { companyId: 42, tokenBalance: { balance: 100 } }
})

describe('company balance refresh', () => {
  it('keeps the newest refresh when an older request finishes last', async () => {
    const store = useProfileStore(createPinia())
    const completeOld = pendingBalance()
    const oldRequest = store.refreshBalance()
    const completeNew = pendingBalance()
    const newRequest = store.refreshBalance()
    completeNew(40)
    await newRequest
    completeOld(90)
    await oldRequest
    expect(store.tokenBalance?.balance).toBe(40)
  })

  it('discards a previous company session’s response even after switching back', async () => {
    const store = useProfileStore(createPinia())
    const completeOld = pendingBalance()
    const oldRequest = store.refreshBalance()
    profile.value = { companyId: 99, tokenBalance: { balance: 11 } }
    expect(store.tokenBalance?.balance).toBe(11)
    profile.value = { companyId: 42, tokenBalance: { balance: 50 } }
    completeOld(90)
    await oldRequest
    expect(store.tokenBalance?.balance).toBe(50)
  })
})
