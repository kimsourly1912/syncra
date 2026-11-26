import { reactive } from 'vue'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useRouter } from '#imports'
import LeadListScreen from '../components/LeadListScreen.vue'
import { fakeApi, httpError } from '#test/fake-api'
import { installModelContext } from '#test/model-context'

const route = reactive({ query: {} as Record<string, string>, params: {}, path: '/lead-inquiry' })

mockNuxtImport('useRoute', () => () => route)

// Sanitized fixtures shaped like the Admin list endpoints.
const lead = {
  id: 7,
  inquiryCode: 'L-0007',
  fullName: 'Test Lead',
  companyName: 'Example Co',
  workEmail: 'lead@example.test',
  interestedProduct: ['Doc AI'],
  status: 'CONTACTED',
}
const page = (items: unknown[], totalPages = 1) => ({ page: 0, size: 20, totalItems: items.length, totalPages, items })
const summary = { leadReceived: 1, contacted: 1, converted: 0, rejected: 0 }

const modelContext = installModelContext()
let wrapper: { unmount: () => void } | undefined

beforeAll(() => modelContext.install())
afterAll(() => modelContext.uninstall())

beforeEach(() => {
  clearNuxtData()
  route.query = {}
  // Navigation is the URL change the list reads; the mocked route follows it. `mountSuspended`
  // itself replaces to '/', a path with no query.
  const navigate = async (to: string | { query?: Record<string, string> }) => {
    route.query = typeof to === 'string' ? {} : { ...to.query }
  }
  vi.spyOn(useRouter(), 'push').mockImplementation(navigate as never)
  vi.spyOn(useRouter(), 'replace').mockImplementation(navigate as never)
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.restoreAllMocks()
})

async function mountList() {
  wrapper = await mountSuspended(LeadListScreen)
  await flushPromises()
  await modelContext.registered('search_leads')
}

describe('lead list agent tools', () => {
  it('describes its tools to the agent as read-only, from the Valibot schema', async () => {
    fakeApi({ 'GET /admin/lead-inquiries': page([lead]), 'GET /admin/lead-inquiries/summary': summary })
    await mountList()

    const tool = modelContext.tool('search_leads')
    expect(tool.annotations).toEqual({ readOnlyHint: true, untrustedContentHint: true })
    expect(tool.inputSchema).toMatchObject({
      properties: {
        status: { enum: ['all', 'new', 'contacted', 'converted', 'not-interested'] },
        search: { type: 'string', maxLength: 100 },
      },
    })
  })

  it('searches through the list\'s URL state and answers with the rows it loaded', async () => {
    const { transport } = fakeApi({
      'GET /admin/lead-inquiries': ({ query }: { query?: unknown }) => (query as { search?: string }).search ? page([lead], 2) : page([]),
      'GET /admin/lead-inquiries/summary': summary,
    })
    await mountList()

    const result = await modelContext.call('search_leads', { status: 'contacted', search: 'example' })

    // The staff member sees the same view: the status tab and the search are in the URL.
    expect(route.query).toEqual({ status: 'contacted', search: 'example' })
    expect(transport).toHaveBeenLastCalledWith('/admin/lead-inquiries', expect.objectContaining({
      query: { status: 'CONTACTED', search: 'example', page: 0, size: 20 },
    }))
    expect(result.isError).toBeUndefined()
    expect(result.text).toContain('Page 1 of 2 of leads matching status "contacted" and "example", 1 on this page:')
    expect(result.text).toContain('- Test Lead (L-0007) · Example Co · lead@example.test · interested in Doc AI · contacted')
  })

  it('refuses input outside the schema without touching the list', async () => {
    fakeApi({ 'GET /admin/lead-inquiries': page([lead]), 'GET /admin/lead-inquiries/summary': summary })
    await mountList()

    const result = await modelContext.call('search_leads', { status: 'archived' })

    expect(result.isError).toBe(true)
    expect(route.query).toEqual({})
  })

  it('answers with the error when the list fails to load', async () => {
    fakeApi({
      'GET /admin/lead-inquiries': ({ query }: { query?: unknown }) => {
        if ((query as { search?: string }).search) throw httpError(503)
        return page([lead])
      },
      'GET /admin/lead-inquiries/summary': summary,
    })
    await mountList()

    const result = await modelContext.call('search_leads', { search: 'example' })

    expect(result.isError).toBe(true)
    expect(result.text).toMatch(/^The list could not load: /)
  })

  it('opens only a lead on screen, in the read-only panel', async () => {
    fakeApi({
      'GET /admin/lead-inquiries': page([lead]),
      'GET /admin/lead-inquiries/summary': summary,
      'GET /admin/lead-inquiries/7': lead,
    })
    await mountList()
    await modelContext.registered('open_lead')

    const targets = await modelContext.call('list_targets', { tool: 'open_lead' })
    expect(JSON.parse(targets.text).targets.open_lead).toEqual([{ target: '7', label: 'Test Lead (L-0007)' }])

    const opened = await modelContext.call('open_lead', { target: '7' })
    expect(opened.text).toContain('Opened Test Lead (L-0007) in the detail panel.')
    expect(route.query).toEqual({ lead: '7' })

    const missing = await modelContext.call('open_lead', { target: '8' })
    expect(missing.isError).toBe(true)
  })

  it('stops offering the tools when the list leaves the screen', async () => {
    fakeApi({ 'GET /admin/lead-inquiries': page([lead]), 'GET /admin/lead-inquiries/summary': summary })
    await mountList()

    wrapper!.unmount()
    wrapper = undefined

    await modelContext.unregistered('search_leads')
  })
})
