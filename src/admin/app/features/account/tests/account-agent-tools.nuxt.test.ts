import { reactive } from 'vue'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useRouter } from '#imports'
import AccountListScreen from '../components/AccountListScreen.vue'
import { fakeApi, listPage, ok } from '#test/fake-api'
import { installModelContext } from '#test/model-context'
import type { Api } from '@/api'

const route = reactive({ query: {} as Record<string, string>, params: {}, path: '/' })

mockNuxtImport('useRoute', () => () => route)

// Sanitized fixtures shaped like `GET /admin/portal-users`.
const user = {
  userId: 12,
  companyId: 4,
  email: 'admin@example.test',
  firstname: 'Test',
  lastname: 'Admin',
  onboardingStatus: 'COMPLETED',
  moduleActiveCount: 3,
  token: 1200,
  seatUsed: 2,
  seatTotal: 5,
} satisfies Api.UserResponseRow
const summary = { accountRegistered: 1, completedOnboardingVerification: 1, pendingOnboardingVerification: 0 } satisfies Api.AdminUserSummaryResponse

const modelContext = installModelContext()
let wrapper: { unmount: () => void } | undefined

beforeAll(() => modelContext.install())
afterAll(() => modelContext.uninstall())

beforeEach(() => {
  clearNuxtData()
  route.query = {}
  // The mocked route follows navigation. `mountSuspended` itself replaces to '/'.
  vi.spyOn(useRouter(), 'replace').mockImplementation((async (to: string | { query?: Record<string, string> }) => {
    route.query = typeof to === 'string' ? {} : { ...to.query }
  }) as never)
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.restoreAllMocks()
})

describe('account list agent tools', () => {
  it('searches through the list\'s URL state and answers with the accounts it loaded', async () => {
    const { transport } = fakeApi({
      'GET /admin/portal-users': ({ query }: { query?: unknown }) => ok((query as { search?: string }).search ? listPage([user]) : listPage([])),
      'GET /admin/portal-users/summary': ok(summary),
    })
    wrapper = await mountSuspended(AccountListScreen)
    await flushPromises()
    await modelContext.registered('search_accounts')

    expect(modelContext.tool('search_accounts').annotations).toEqual({ readOnlyHint: true, untrustedContentHint: true })

    const result = await modelContext.call('search_accounts', { search: 'example' })

    expect(route.query).toEqual({ search: 'example' })
    expect(transport).toHaveBeenLastCalledWith('/admin/portal-users', expect.objectContaining({
      query: { search: 'example', page: 0, size: 20 },
    }))
    expect(result.text).toBe([
      'Page 1 of 1 of accounts matching "example", 1 on this page:',
      '- Test Admin <admin@example.test> · user 12 · company 4 · onboarding complete · 3 modules · 1,200 tokens · seats 2/5',
    ].join('\n'))
  })

  it('says so when nothing matches', async () => {
    fakeApi({ 'GET /admin/portal-users': ok(listPage([])), 'GET /admin/portal-users/summary': ok(summary) })
    wrapper = await mountSuspended(AccountListScreen)
    await flushPromises()
    await modelContext.registered('search_accounts')

    const result = await modelContext.call('search_accounts', { search: 'nobody' })

    expect(result.text).toBe('No accounts match "nobody".')
  })
})
