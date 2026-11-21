import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData } from '#imports'
import AccountListScreen from '../../app/features/account/components/AccountListScreen.vue'
import LeadListScreen from '../../app/features/lead-inquiry/components/LeadListScreen.vue'
import SaleRequestListScreen from '../../app/features/sale-request/components/SaleRequestListScreen.vue'
import { fakeApi, httpError, ok, refused } from '../fake-api'

// Reactive, like the real route. Each test sets the list's URL query.
const route = reactive({ query: {} as Record<string, string>, params: {}, path: '/' })

mockNuxtImport('useRoute', () => () => route)

// Sanitized fixtures shaped like the Admin list endpoints.
const lead = {
  id: 7,
  inquiryCode: 'L-0007',
  fullName: 'Test Lead',
  companyName: 'Example Co',
  workEmail: 'lead@example.test',
  phoneNumber: '+10000000000',
  status: 'CONTACTED',
}
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
}
const saleRequest = {
  id: 5,
  requestCode: 'SR-0005',
  userName: 'Test Buyer',
  emailAddress: 'buyer@example.test',
  requestType: 'TOKEN',
  source: 'CUSTOMER_PORTAL',
  submitDate: '2026-11-01T09:30:00',
  status: 'PENDING',
}

const page = (items: unknown[], totalPages = 1) => ({ page: 0, size: 20, totalItems: items.length, totalPages, items })

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

describe('lead list screen', () => {
  it('sends the URL state as the API query, lists leads, and shows the totals', async () => {
    route.query = { status: 'contacted', search: 'example', page: '2', size: '50' }
    transport = fakeApi({
      'GET /admin/lead-inquiries': page([lead], 3),
      'GET /admin/lead-inquiries/summary': { leadReceived: 120, contacted: 30, converted: 12, rejected: 4 },
    }).transport
    const wrapper = await mount(LeadListScreen)

    // No envelope on this endpoint; the API's page is zero-based.
    expect(transport).toHaveBeenCalledWith('/admin/lead-inquiries', expect.objectContaining({
      query: { status: 'CONTACTED', search: 'example', page: 1, size: 50 },
    }))
    const link = wrapper.find('a[href="/lead-inquiry/7"]')
    expect(link.text()).toBe('Test Lead')
    expect(wrapper.text()).toContain('L-0007')
    expect(wrapper.text()).toContain('Contacted')
    expect(wrapper.text()).toContain('120')
    expect(wrapper.find('nav[aria-label="Pagination"]').text()).toContain('Page 2 of 3')
  })

  it('sends no status for All and leaves an empty search out', async () => {
    transport = fakeApi({
      'GET /admin/lead-inquiries': page([]),
      'GET /admin/lead-inquiries/summary': {},
    }).transport
    const wrapper = await mount(LeadListScreen)

    const call = transport.mock.calls.find(([endpoint]) => endpoint === '/admin/lead-inquiries')!
    expect(call[1]).toMatchObject({ query: { page: 0, size: 20 } })
    expect((call[1] as { query: Record<string, unknown> }).query.status).toBeUndefined()
    expect((call[1] as { query: Record<string, unknown> }).query.search).toBeUndefined()
    // Nothing yet, nothing filtered; a total the API didn't send leaves its tab without a count.
    expect(wrapper.text()).toContain('No leads yet')
    expect(wrapper.find('[role="tab"]').text()).toBe('All')
  })

  it('tells a filtered empty list apart, with Clear filters', async () => {
    route.query = { search: 'nobody' }
    fakeApi({
      'GET /admin/lead-inquiries': page([]),
      'GET /admin/lead-inquiries/summary': {},
    })
    const wrapper = await mount(LeadListScreen)

    expect(wrapper.text()).toContain('No leads match your filters')
    expect(wrapper.text()).toContain('Clear filters')
  })

  it('shows an error with Retry for a failed list, and keeps the totals', async () => {
    fakeApi({
      'GET /admin/lead-inquiries': () => {
        throw httpError(503)
      },
      'GET /admin/lead-inquiries/summary': { leadReceived: 5 },
    })
    const wrapper = await mount(LeadListScreen)

    expect(wrapper.text()).toContain('Could not load leads')
    expect(wrapper.text()).toContain('Retry')
    expect(wrapper.text()).toContain('5')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('shows a contract error when a row breaks the model', async () => {
    fakeApi({
      'GET /admin/lead-inquiries': page([{ ...lead, id: null }]),
      'GET /admin/lead-inquiries/summary': {},
    })
    const wrapper = await mount(LeadListScreen)

    expect(wrapper.text()).toContain('Unexpected response from GET /admin/lead-inquiries')
    expect(wrapper.text()).not.toContain('No leads yet')
  })
})

describe('account list screen', () => {
  it('sends search and page, lists accounts, and opens one from its name', async () => {
    route.query = { search: 'example' }
    transport = fakeApi({
      'GET /admin/portal-users': ok(page([portalUser])),
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
      'GET /admin/portal-users': ok(page([portalUser])),
      'GET /admin/portal-users/summary': refused('Totals unavailable'),
    })
    const wrapper = await mount(AccountListScreen)

    expect(wrapper.text()).toContain('Could not load account totals')
    expect(wrapper.find('a[href="/account/42"]').exists()).toBe(true)
  })
})

describe('sale request list screen', () => {
  it('sends status, type, and search, and lists requests without a link', async () => {
    route.query = { status: 'pending', type: 'token', search: 'buyer' }
    transport = fakeApi({
      'GET /admin/sale-requests': page([saleRequest]),
      'GET /admin/sale-requests/dashboard': { total: 9, pending: 4, approved: 3, rejected: 2 },
    }).transport
    const wrapper = await mount(SaleRequestListScreen)

    expect(transport).toHaveBeenCalledWith('/admin/sale-requests', expect.objectContaining({
      query: { status: 'PENDING', type: 'TOKEN', search: 'buyer', page: 0, size: 20 },
    }))
    expect(wrapper.text()).toContain('SR-0005')
    expect(wrapper.text()).toContain('Test Buyer')
    expect(wrapper.text()).toContain('Customer Portal')
    expect(wrapper.text()).toContain('Token')
    // No detail page exists yet.
    expect(wrapper.find('tbody a').exists()).toBe(false)
  })

  it('reads an unknown type in the URL as All types', async () => {
    route.query = { type: 'bulk' }
    transport = fakeApi({
      'GET /admin/sale-requests': page([]),
      'GET /admin/sale-requests/dashboard': {},
    }).transport
    const wrapper = await mount(SaleRequestListScreen)

    const call = transport.mock.calls.find(([endpoint]) => endpoint === '/admin/sale-requests')!
    expect((call[1] as { query: Record<string, unknown> }).query.type).toBeUndefined()
    expect(wrapper.text()).toContain('No sale requests yet')
  })
})
