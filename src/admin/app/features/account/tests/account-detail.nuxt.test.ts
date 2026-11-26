import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useState } from '#imports'
import AccountDetailScreen from '../components/AccountDetailScreen.vue'
import { fakeApi, httpError, ok } from '#test/fake-api'
import type { Api } from '@/api'

const route = reactive({ query: {} as Record<string, string>, params: {}, path: '/account/42' })
mockNuxtImport('useRoute', () => () => route)

// Sanitized fixture shaped like `GET /admin/portal-users/{userId}/account-detail`.
const detail = {
  overview: { userId: 42, username: 'Test User', email: 'user@example.test', registeredDate: '2026-01-15', onboardingStatus: 'COMPLETED', role: 'COMPANY_ADMIN', companyId: 9 },
  companyInformation: {
    companyDetail: { companyName: 'Example Co', companyEmail: 'office@example.test', industryType: 'Garments', companySize: '11-50', country: 'Exampleland', phoneNumber: '+10000000000' },
    representative: { fullName: 'Test Representative', position: 'Manager', workEmail: 'rep@example.test', contactNumber: '+10000000001' },
  },
} satisfies Api.AccountDetailInitResponse

const mounted: { unmount: () => void }[] = []
afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})
beforeEach(() => {
  clearNuxtData()
  route.query = {}
  useState('session:status').value = 'signed-in'
  useState('session:staff').value = { id: 1, email: 'staff@example.test' }
})

async function mount(userId: number | undefined) {
  const wrapper = await mountSuspended(AccountDetailScreen, { props: { userId } })
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

describe('account detail screen', () => {
  it('shows the account and its company from the API', async () => {
    const { transport } = fakeApi({ 'GET /admin/portal-users/42/account-detail': ok(detail) })
    const wrapper = await mount(42)

    expect(transport).toHaveBeenCalledWith('/admin/portal-users/42/account-detail', expect.anything())
    const text = wrapper.text()
    expect(text).toContain('Test User')
    expect(text).toContain('Example Co · User #42')
    expect(text).toContain('Company admin')
    expect(text).toContain('Onboarding complete')
    expect(text).toContain('Exampleland')
    expect(text).toContain('Test Representative')
    expect(text).not.toContain('Sample data')
  })

  it('labels the tabs without an API as sample data', async () => {
    route.query = { tab: 'token' }
    fakeApi({ 'GET /admin/portal-users/42/account-detail': ok(detail) })
    const wrapper = await mount(42)

    expect(wrapper.text()).toContain('Sample data')
    expect(wrapper.text()).toContain('isn\'t connected to the API yet')
  })

  it('shows Account not found for a bad id or a 404, without asking for a bad id', async () => {
    const { transport } = fakeApi({
      'GET /admin/portal-users/7/account-detail': () => { throw httpError(404) },
    })
    const badId = await mount(undefined)
    expect(badId.text()).toContain('Account not found')
    expect(transport).not.toHaveBeenCalled()

    const missing = await mount(7)
    expect(missing.text()).toContain('Account not found')
  })

  it('offers Retry when the account fails to load', async () => {
    fakeApi({
      'GET /admin/portal-users/42/account-detail': () => { throw httpError(500) },
    })
    const wrapper = await mount(42)

    expect(wrapper.text()).toContain('Could not load this account')
    expect(wrapper.findAll('button').some(button => button.text().includes('Retry'))).toBe(true)
  })
})
