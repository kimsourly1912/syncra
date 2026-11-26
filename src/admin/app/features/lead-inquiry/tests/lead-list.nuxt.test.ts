import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useRouter } from '#imports'
import LeadListScreen from '../components/LeadListScreen.vue'
import { fakeApi, httpError } from '#test/fake-api'

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
    expect(wrapper.find('tbody button').text()).toBe('Test Lead')
    expect(wrapper.text()).toContain('lead@example.test')
    expect(wrapper.text()).toContain('Example Co')
    // The detail isn't loaded until a lead is opened.
    expect(transport).not.toHaveBeenCalledWith('/admin/lead-inquiries/7', expect.anything())
    expect(wrapper.text()).toContain('L-0007')
    expect(wrapper.text()).toContain('Contacted')
    expect(wrapper.text()).toContain('120')
    expect(wrapper.find('nav[aria-label="Pagination"]').text()).toContain('Page 2 of 3')
  })

  it('opens a lead from its row, keeping the list query', async () => {
    route.query = { status: 'contacted' }
    fakeApi({
      'GET /admin/lead-inquiries': page([lead]),
      'GET /admin/lead-inquiries/summary': {},
    })
    const replace = vi.spyOn(useRouter(), 'replace').mockResolvedValue(undefined)
    const wrapper = await mount(LeadListScreen)

    await wrapper.find('tbody button').trigger('click')

    expect(replace).toHaveBeenCalledWith({ query: { status: 'contacted', lead: '7' } })
    replace.mockRestore()
  })

  it('shows the open lead read-only: interests, goals, and no status actions', async () => {
    route.query = { lead: '7' }
    transport = fakeApi({
      'GET /admin/lead-inquiries': page([lead]),
      'GET /admin/lead-inquiries/summary': {},
      'GET /admin/lead-inquiries/7': {
        ...lead,
        country: 'Exampleland',
        interestedProduct: ['Doc AI'],
        modules: [{ id: 1, code: 'DOC_AI', name: 'Doc AI' }, { id: 2, code: 'ERP', name: 'ERP Sync' }],
        mainGoals: 'Sample goal text.',
        agreedToContact: true,
      },
    }).transport
    await mount(LeadListScreen)

    expect(transport).toHaveBeenCalledWith('/admin/lead-inquiries/7', expect.anything())
    const panel = document.body.textContent ?? ''
    expect(panel).toContain('Sample goal text.')
    expect(panel).toContain('Exampleland')
    expect(panel).toContain('ERP Sync')
    // Doc AI is both a product and a module, and is named once.
    expect(panel.match(/Doc AI/g)).toHaveLength(1)
    expect(panel).toContain('isn\'t available in Admin yet')
    const dialogButtons = [...document.querySelectorAll('[role="dialog"] button')]
    expect(dialogButtons.some(button => /contacted|converted|interested/i.test(button.textContent ?? ''))).toBe(false)
  })

  it('shows a retry when the open lead fails to load', async () => {
    route.query = { lead: '7' }
    fakeApi({
      'GET /admin/lead-inquiries': page([lead]),
      'GET /admin/lead-inquiries/summary': {},
      'GET /admin/lead-inquiries/7': () => { throw httpError(500) },
    })
    await mount(LeadListScreen)

    expect(document.body.textContent).toContain('Could not load this lead')
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
