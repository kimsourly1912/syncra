import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useRouter } from '#imports'
import SaleRequestListScreen from '../components/SaleRequestListScreen.vue'
import { fakeApi, httpError, listPage } from '#test/fake-api'
import type { Api } from '@/api'

// Reactive, like the real route. Each test sets the list's URL query.
const route = reactive({ query: {} as Record<string, string>, params: {}, path: '/' })

mockNuxtImport('useRoute', () => () => route)

// Sanitized fixtures shaped like the Admin list endpoints.
const saleRequest = {
  id: 5,
  requestCode: 'SR-0005',
  userName: 'Test Buyer',
  emailAddress: 'buyer@example.test',
  requestType: 'TOKEN',
  source: 'CUSTOMER_PORTAL',
  submitDate: '2026-11-01T09:30:00',
  status: 'PENDING',
} satisfies Api.SaleRequestListItemDto

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

describe('sale request list screen', () => {
  it('sends status, type, and search, and lists requests', async () => {
    route.query = { status: 'pending', type: 'token', search: 'buyer' }
    transport = fakeApi({
      'GET /admin/sale-requests': listPage([saleRequest]),
      'GET /admin/sale-requests/dashboard': { total: 9, pending: 4, approved: 3, rejected: 2 },
    }).transport
    const wrapper = await mount(SaleRequestListScreen)

    expect(transport).toHaveBeenCalledWith('/admin/sale-requests', expect.objectContaining({
      query: { status: 'PENDING', type: 'TOKEN', search: 'buyer', page: 0, size: 20 },
    }))
    expect(wrapper.text()).toContain('SR-0005')
    expect(wrapper.text()).toContain('Test Buyer')
    expect(wrapper.text()).toContain('buyer@example.test')
    expect(wrapper.text()).toContain('Customer Portal')
    expect(wrapper.text()).toContain('Token')
    // The detail isn't loaded until a request is opened.
    expect(transport).not.toHaveBeenCalledWith('/admin/sale-requests/5', expect.anything())
  })

  it('opens a request from its row, keeping the list query', async () => {
    route.query = { status: 'pending' }
    fakeApi({
      'GET /admin/sale-requests': listPage([saleRequest]),
      'GET /admin/sale-requests/dashboard': {},
    })
    const replace = vi.spyOn(useRouter(), 'replace').mockResolvedValue(undefined)
    const wrapper = await mount(SaleRequestListScreen)

    await wrapper.find('tbody button').trigger('click')

    expect(replace).toHaveBeenCalledWith({ query: { status: 'pending', request: '5' } })
    replace.mockRestore()
  })

  it('shows the open request read-only: message, modules, and no actions', async () => {
    route.query = { request: '5' }
    transport = fakeApi({
      'GET /admin/sale-requests': listPage([saleRequest]),
      'GET /admin/sale-requests/dashboard': {},
      'GET /admin/sale-requests/5': {
        summary: { requestCode: 'SR-0005', requestedByName: 'Test Buyer', requestedType: 'MODULE', requestStatus: 'PENDING', customerMessage: 'Please add sample features.' },
        moduleItems: [{ id: 1, moduleCode: 'DOC_AI', moduleName: 'Doc AI', requestedFeatures: ['Invoices', 'TechPacks'] }],
      },
    }).transport
    await mount(SaleRequestListScreen)

    expect(transport).toHaveBeenCalledWith('/admin/sale-requests/5', expect.anything())
    const panel = document.body.textContent ?? ''
    expect(panel).toContain('Please add sample features.')
    expect(panel).toContain('Doc AI')
    expect(panel).toContain('TechPacks')
    expect(panel).toContain('isn\'t available in Admin yet')
    expect([...document.querySelectorAll('button')].some(button => /approve|reject/i.test(button.textContent ?? ''))).toBe(false)
  })

  it('shows a retry when the open request fails to load', async () => {
    route.query = { request: '5' }
    fakeApi({
      'GET /admin/sale-requests': listPage([saleRequest]),
      'GET /admin/sale-requests/dashboard': {},
      'GET /admin/sale-requests/5': () => { throw httpError(500) },
    })
    await mount(SaleRequestListScreen)

    expect(document.body.textContent).toContain('Could not load this sale request')
  })

  it('reads an unknown type in the URL as All types', async () => {
    route.query = { type: 'bulk' }
    transport = fakeApi({
      'GET /admin/sale-requests': listPage([]),
      'GET /admin/sale-requests/dashboard': {},
    }).transport
    const wrapper = await mount(SaleRequestListScreen)

    const call = transport.mock.calls.find(([endpoint]) => endpoint === '/admin/sale-requests')!
    expect((call[1] as { query: Record<string, unknown> }).query.type).toBeUndefined()
    expect(wrapper.text()).toContain('No sale requests yet')
  })
})
