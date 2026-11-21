import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import ReviewQueueScreen from '../../app/features/techpack-review/components/ReviewQueueScreen.vue'
import ReviewDetailScreen from '../../app/features/techpack-review/components/ReviewDetailScreen.vue'
import { fakeApi } from '../fake-api'

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
  api = fakeApi().transport
  navigate.mockReset()
})

describe('review queue screen', () => {
  it('lists reviews with a link to each open draft', async () => {
    respondByEndpoint({ 'techpack-reviews': { success: true, data: { content: [item], totalPages: 1 } } })
    const wrapper = await mountSuspended(ReviewQueueScreen)
    await flushPromises()

    expect(wrapper.text()).toContain('sample-techpack.pdf')
    expect(wrapper.text()).toContain('Company 303 · Job 202')
    expect(wrapper.text()).toContain('Open review')
  })

  it('shows the API reason when the list resolves with success: false', async () => {
    respondByEndpoint({ 'techpack-reviews': { success: false, reason: 'Queue unavailable', data: null } })
    const wrapper = await mountSuspended(ReviewQueueScreen)
    await flushPromises()

    expect(wrapper.text()).toContain('Queue unavailable')
    expect(wrapper.text()).not.toContain('Open review')
  })

  it('shows a contract error instead of an empty queue', async () => {
    respondByEndpoint({ 'techpack-reviews': { success: true, data: { content: [{ ...item, filename: null }], totalPages: 1 } } })
    const wrapper = await mountSuspended(ReviewQueueScreen)
    await flushPromises()

    expect(wrapper.text()).toContain('Unexpected response from GET admin/docai/techpack-reviews')
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

    expect(api).toHaveBeenCalledWith('admin/docai/techpack-reviews/101/draft-inspection', expect.objectContaining({
      query: { draftUuid: item.draftUuid },
    }))
    expect(wrapper.text()).toContain('sample-techpack.pdf')
    expect(wrapper.text()).toContain('1 difference from the PDF')
    expect(wrapper.text()).toContain('PDF 52 · Workbook 50')
    expect(wrapper.text()).toContain('Measurements · B1')

    const approve = wrapper.findAll('button').find(button => button.text().includes('Approve and release'))
    expect(approve?.attributes('disabled')).toBeDefined()
  })
})
