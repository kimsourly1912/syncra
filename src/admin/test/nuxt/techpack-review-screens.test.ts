import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useRouter } from '#imports'
import ReviewQueueScreen from '../../app/features/techpack-review/components/ReviewQueueScreen.vue'
import ReviewDetailScreen from '../../app/features/techpack-review/components/ReviewDetailScreen.vue'
import { fakeApi, ok } from '../fake-api'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))

mockNuxtImport('navigateTo', () => navigate)
// The first queue page, In Review status.
mockNuxtImport('useRoute', () => () => ({ query: {}, params: {}, path: '/techpack-reviews' }))

// Sanitized fixtures shaped like the TechPack review endpoints.
const item = {
  fileId: 101,
  jobId: 202,
  companyId: 303,
  filename: 'sample-techpack.pdf',
  draftUuid: '00000000-0000-4000-8000-000000000001',
  status: 'IN_REVIEW',
  reviewedAt: null,
}

const inspection = {
  partial: false,
  sheets: [{ name: 'Measurements', columns: ['A', 'B'], rows: [{ number: 1, cells: ['Chest', '50'] }], gridHeaderRow: 0 }],
  findings: [{ rowNumber: 1, columnIndex: 1, measurement: 'Chest', column: 'M', sourcePage: 1, workbookValue: '50', pdfValue: '52' }],
  sourceCheck: { verified: false, blocksApproval: true, comparedCells: 1, notes: [] },
  aiReview: null,
}

let api: ReturnType<typeof fakeApi>['transport']

/** Answers each endpoint by its longest matching suffix. */
function respondByEndpoint(responses: Record<string, unknown>) {
  api.mockImplementation(async (endpoint: string) => {
    const match = Object.keys(responses).sort((a, b) => b.length - a.length).find(key => endpoint.endsWith(key))
    if (!match) throw new Error(`unexpected ${endpoint}`)
    return responses[match]
  })
}

beforeEach(() => {
  // Screens share loaded data by key; every test starts from nothing loaded.
  clearNuxtData()
  api = fakeApi().transport
  navigate.mockReset()
})

describe('review queue screen', () => {
  it('lists reviews with a link to each open draft', async () => {
    respondByEndpoint({ 'techpack-reviews': { success: true, data: { content: [item], totalPages: 1 } } })
    const wrapper = await mountSuspended(ReviewQueueScreen)
    await flushPromises()

    // The filename is the link into the review.
    const link = wrapper.find('a[href="/techpack-reviews/101"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('sample-techpack.pdf')
    expect(wrapper.text()).toContain('Company 303 · Job 202')
    expect(wrapper.find('[role="group"][aria-label="Review status"]').text()).toContain('In Review')
  })

  it('shows the status-specific empty message', async () => {
    respondByEndpoint({ 'techpack-reviews': { success: true, data: { content: [], totalPages: 0 } } })
    const wrapper = await mountSuspended(ReviewQueueScreen)
    await flushPromises()

    expect(wrapper.text()).toContain('No TechPacks are waiting for review.')
    expect(wrapper.find('nav[aria-label="Pagination"]').exists()).toBe(false)
  })

  it('shows the pager when there is more than one page', async () => {
    respondByEndpoint({ 'techpack-reviews': { success: true, data: { content: [item], totalPages: 3 } } })
    const wrapper = await mountSuspended(ReviewQueueScreen)
    await flushPromises()

    expect(wrapper.find('nav[aria-label="Pagination"]').text()).toContain('Page 1 of 3')
  })

  it('shows the API reason when the list resolves with success: false', async () => {
    respondByEndpoint({ 'techpack-reviews': { success: false, reason: 'Queue unavailable', data: null } })
    const wrapper = await mountSuspended(ReviewQueueScreen)
    await flushPromises()

    expect(wrapper.text()).toContain('Queue unavailable')
    expect(wrapper.text()).toContain('Retry')
    expect(wrapper.find('a[href^="/techpack-reviews/"]').exists()).toBe(false)
  })

  it('shows a contract error instead of an empty queue', async () => {
    respondByEndpoint({ 'techpack-reviews': { success: true, data: { content: [{ ...item, filename: null }], totalPages: 1 } } })
    const wrapper = await mountSuspended(ReviewQueueScreen)
    await flushPromises()

    expect(wrapper.text()).toContain('Unexpected response from GET /admin/docai/techpack-reviews')
    expect(wrapper.text()).not.toContain('No TechPacks are waiting for review.')
  })
})

describe('review detail screen', () => {
  it('refuses an invalid file id without calling the API', async () => {
    const wrapper = await mountSuspended(ReviewDetailScreen, { props: { fileId: 'abc' } })
    await flushPromises()

    expect(wrapper.text()).toContain('This TechPack review could not be found.')
    expect(api).not.toHaveBeenCalled()
  })

  it('loads the review, PDF preview, and inspection, and blocks approval on PDF findings', async () => {
    respondByEndpoint({
      'techpack-reviews/101': { success: true, data: item },
      'source-preview': { success: true, data: { pageCount: 2, pngBase64: 'iVBORw0KGgo=' } },
      'draft-inspection': { success: true, data: inspection },
    })
    const wrapper = await mountSuspended(ReviewDetailScreen, { props: { fileId: '101' } })
    await flushPromises()

    expect(api).toHaveBeenCalledWith('/admin/docai/techpack-reviews/101/draft-inspection', expect.objectContaining({
      query: { draftUuid: item.draftUuid },
    }))
    expect(wrapper.text()).toContain('sample-techpack.pdf')
    expect(wrapper.text()).toContain('1 difference from the PDF')
    expect(wrapper.text()).toContain('PDF 52 · Workbook 50')
    expect(wrapper.text()).toContain('Measurements · B1')

    const approve = wrapper.findAll('button').find(button => button.text().includes('Approve and release'))
    expect(approve?.attributes('disabled')).toBeDefined()
  })

  // A draft the reviewer can approve: no differences, and the whole workbook shown.
  const clean = { ...inspection, findings: [], sourceCheck: { verified: true, blocksApproval: false, comparedCells: 1, notes: [] } }
  const preview = ok({ pageCount: 1, pngBase64: 'iVBORw0KGgo=' })

  it('saves inline corrections against the current draftUuid, then reloads the review', async () => {
    respondByEndpoint({
      'techpack-reviews/102': ok({ ...item, fileId: 102 }),
      'source-preview': preview,
      'draft-inspection': ok(inspection),
      'draft-corrections': ok({ ...item, fileId: 102 }),
    })
    const wrapper = await mountSuspended(ReviewDetailScreen, { props: { fileId: '102' } })
    await flushPromises()

    await wrapper.findAll('button').find(button => button.text().includes('PDF 52'))!.trigger('click')
    await wrapper.findAll('button').find(button => button.text() === 'Use PDF value')!.trigger('click')
    expect(wrapper.text()).toContain('1 unsaved correction')
    await wrapper.findAll('button').find(button => button.text().includes('Save corrections'))!.trigger('click')
    await flushPromises()

    expect(api).toHaveBeenCalledWith('/admin/docai/techpack-reviews/102/draft-corrections', expect.objectContaining({
      method: 'POST',
      body: { draftUuid: item.draftUuid, corrections: [{ sheetIndex: 0, rowNumber: 1, columnIndex: 1, value: '52' }] },
    }))
    expect(api.mock.calls.filter(([url]) => url === '/admin/docai/techpack-reviews/102')).toHaveLength(2)
    expect(wrapper.text()).not.toContain('unsaved correction')
  })

  it('approves only after the attestation, then opens the Reviewed queue', async () => {
    const replace = vi.spyOn(useRouter(), 'replace').mockResolvedValue(undefined)
    respondByEndpoint({
      'techpack-reviews/103': ok({ ...item, fileId: 103 }),
      'source-preview': preview,
      'draft-inspection': ok(clean),
      'approve': ok(null),
    })
    const wrapper = await mountSuspended(ReviewDetailScreen, { props: { fileId: '103' } })
    await flushPromises()

    const approve = () => wrapper.findAll('button').find(button => button.text().includes('Approve and release'))!
    expect(approve().attributes('disabled')).toBeDefined()
    await wrapper.find('[role="checkbox"]').trigger('click')
    expect(approve().attributes('disabled')).toBeUndefined()
    await approve().trigger('click')
    await flushPromises()

    expect(api).toHaveBeenCalledWith('/admin/docai/techpack-reviews/103/approve', expect.objectContaining({
      method: 'POST', body: { draftUuid: item.draftUuid, sourceVerified: true },
    }))
    expect(replace).toHaveBeenCalledWith({ path: '/techpack-reviews', query: { status: 'reviewed' } })
  })
})
