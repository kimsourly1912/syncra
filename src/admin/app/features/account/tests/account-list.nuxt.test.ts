import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData } from '#imports'
import AccountListScreen from '../components/AccountListScreen.vue'
import { fakeApi, listPage, ok, refused } from '#test/fake-api'
import type { Api } from '@/api'

// Reactive, like the real route. Each test sets the list's URL query.
const route = reactive({ query: {} as Record<string, string>, params: {}, path: '/' })

mockNuxtImport('useRoute', () => () => route)

// Sanitized fixtures shaped like the Admin list endpoints.
const portalUser = {
  userId: 42,
  companyId: 9,
  email: 'user@example.test',
  firstname: 'Test',
  lastname: 'User',
  onboardingStatus: 'PENDING',
  moduleActiveCount: 2,
  token: 1500,
  seatUsed: 3,
  seatTotal: 10,
} satisfies Api.UserResponseRow

let transport: ReturnType<typeof fakeApi>['transport']
const mounted: { unmount: () => void }[] = []

// A screen left mounted would follow the next test's URL and load through the old fake API.
afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})

beforeEach(() => {
  // Screens share loaded data by key; every test starts from nothing loaded.
  clearNuxtData()
  route.query = {}
})

async function mount(component: Parameters<typeof mountSuspended>[0]) {
  const wrapper = await mountSuspended(component)
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

describe('account list screen', () => {
  it('sends search and page, lists accounts, and opens one from its name', async () => {
    route.query = { search: 'example' }
    transport = fakeApi({
      'GET /admin/portal-users': ok(listPage([portalUser])),
      'GET /admin/portal-users/summary': ok({ accountRegistered: 100, completedOnboardingVerification: 60, pendingOnboardingVerification: 40 }),
    }).transport
    const wrapper = await mount(AccountListScreen)

    expect(transport).toHaveBeenCalledWith('/admin/portal-users', expect.objectContaining({
      query: { search: 'example', page: 0, size: 20 },
    }))
    expect(wrapper.find('a[href="/account/42"]').text()).toBe('Test User')
    expect(wrapper.text()).toContain('Pending')
    expect(wrapper.text()).toContain('3/10')
    expect(wrapper.text()).toContain('1,500')
    expect(wrapper.text()).toContain('100')
    expect(wrapper.text()).toContain('User #42 · Company #9')
    // The phone card ends with three labelled numbers.
    const card = wrapper.find('ul[aria-label="Accounts"] > li')
    expect(card.find('a[href="/account/42"]').exists()).toBe(true)
    expect(card.findAll('dt').map(term => term.text())).toEqual(['Modules', 'Tokens', 'Seats'])
    expect(card.findAll('dd').map(value => value.text())).toEqual(['2', '1,500', '3/10'])
  })

  it('shows the email once when the account has no name', async () => {
    fakeApi({
      'GET /admin/portal-users': ok(listPage([{ ...portalUser, firstname: null, lastname: null }])),
      'GET /admin/portal-users/summary': ok({}),
    })
    const wrapper = await mount(AccountListScreen)

    expect(wrapper.find('a[href="/account/42"]').text()).toBe('user@example.test')
    // Once in the table and once in the phone card: the link text only, no second email line.
    expect(wrapper.text().split('user@example.test')).toHaveLength(3)
  })

  it('shows the onboarding status filter disabled, since the API cannot filter by it', async () => {
    transport = fakeApi({
      'GET /admin/portal-users': ok(listPage([portalUser])),
      'GET /admin/portal-users/summary': ok({}),
    }).transport
    const wrapper = await mount(AccountListScreen)

    const select = wrapper.find('[aria-label="Onboarding status"]')
    expect(select.exists()).toBe(true)
    expect(select.attributes('disabled')).toBeDefined()
    const call = transport.mock.calls.find(([endpoint]) => endpoint === '/admin/portal-users')!
    expect(call[1]).toMatchObject({ query: { page: 0, size: 20 } })
    expect((call[1] as { query: Record<string, unknown> }).query).not.toHaveProperty('onboardingStatus')
  })

  it('shows the API reason for a refused list', async () => {
    fakeApi({
      'GET /admin/portal-users': refused('Search unavailable'),
      'GET /admin/portal-users/summary': ok({}),
    })
    const wrapper = await mount(AccountListScreen)

    expect(wrapper.text()).toContain('Could not load accounts')
    expect(wrapper.text()).toContain('Search unavailable')
  })

  it('shows its own error with Retry when the totals fail', async () => {
    fakeApi({
      'GET /admin/portal-users': ok(listPage([portalUser])),
      'GET /admin/portal-users/summary': refused('Totals unavailable'),
    })
    const wrapper = await mount(AccountListScreen)

    expect(wrapper.text()).toContain('Could not load account totals')
    expect(wrapper.find('a[href="/account/42"]').exists()).toBe(true)
  })
})
