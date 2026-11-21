import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useRouter } from '#imports'
import ReviewQueueScreen from '../../app/features/techpack-review/components/ReviewQueueScreen.vue'
import ReviewDetailScreen from '../../app/features/techpack-review/components/ReviewDetailScreen.vue'
import { fakeApi, ok } from '../fake-api'

const { navigate, route } = vi.hoisted(() => ({
  navigate: vi.fn(),
  route: { query: {} as Record<string, string>, params: {}, path: '/techpack-reviews' },
}))

mockNuxtImport('navigateTo', () => navigate)
mockNuxtImport('useRoute', () => () => route)

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
  route.query = {}
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
    expect(wrapper.findAll('th').map(cell => cell.text())).toEqual(['TechPack file', 'Company ID', 'Job ID'])
    expect(wrapper.findAll('td').map(cell => cell.text())).toEqual(['sample-techpack.pdf', '303', '202'])
    expect(wrapper.find('[role="group"][aria-label="Review status"]').text()).toContain('In Review')
  })

  it('shows the review date column and plain filenames for released records', async () => {
    route.query = { status: 'reviewed' }
    respondByEndpoint({
      'techpack-reviews': ok({ content: [{ ...item, status: 'REVIEWED', draftUuid: null }], totalPages: 1 }),
    })
    const wrapper = await mountSuspended(ReviewQueueScreen)
    await flushPromises()

    expect(wrapper.text()).toContain('Reviewed at')
    expect(wrapper.findAll('td').map(cell => cell.text())).toEqual(['sample-techpack.pdf', '303', '202', '—'])
    expect(wrapper.find('a[href="/techpack-reviews/101"]').exists()).toBe(false)
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

async function openReviewIssues(wrapper: VueWrapper) {
  const trigger = wrapper.findAll('button').find(button => button.text().startsWith('Review issues ('))
  expect(trigger).toBeDefined()
  await trigger!.trigger('click')
  await flushPromises()
  return [...document.querySelectorAll<HTMLButtonElement>('ul[aria-label="Workbook findings"] button')]
}

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
    const wrapper = await mountSuspended(ReviewDetailScreen, { props: { fileId: '101' }, attachTo: document.body })
    await flushPromises()

    expect(api).toHaveBeenCalledWith('/admin/docai/techpack-reviews/101/draft-inspection', expect.objectContaining({
      query: { draftUuid: item.draftUuid },
    }))
    expect(wrapper.text()).toContain('sample-techpack.pdf')
    expect(wrapper.text()).toContain('Review issues (1)')
    expect(wrapper.find('section[aria-label="Selected review issue"]').exists()).toBe(false)
    const [pdf] = await openReviewIssues(wrapper)
    expect(pdf?.textContent).toContain('PDF difference')
    expect(pdf?.textContent).toContain('Measurements · B1')
    expect(wrapper.text()).toContain('Resolve the PDF differences before approving.')

    const approve = wrapper.findAll('button').find(button => button.text().includes('Approve and release'))
    expect(approve?.attributes('disabled')).toBeDefined()
    expect(wrapper.find('[role="checkbox"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('selects PDF and AI findings separately and saves a single correction for their shared cell', async () => {
    const sharedCell = {
      ...inspection,
      findings: [{ ...inspection.findings[0], sourcePage: 2 }],
      aiReview: {
        findings: [{ sheetIndex: 0, rowNumber: 1, columnIndex: 1, measurement: 'Chest', column: 'M', sourcePage: 1, workbookValue: '50', aiValue: '49' }],
      },
    }
    respondByEndpoint({
      'techpack-reviews/104': ok({ ...item, fileId: 104 }),
      'source-preview': ok({ pageCount: 2, pngBase64: 'iVBORw0KGgo=' }),
      'draft-inspection': ok(sharedCell),
      'draft-corrections': ok(null),
    })
    const wrapper = await mountSuspended(ReviewDetailScreen, { props: { fileId: '104' }, attachTo: document.body })
    await flushPromises()

    const [pdf] = await openReviewIssues(wrapper)
    pdf!.click()
    await flushPromises()
    expect(wrapper.get('section[aria-label="Selected review issue"]').text()).toContain('PDF difference')
    expect(wrapper.find('[data-cell="0-1-1"]').classes()).toContain('active-cell')
    expect(api).toHaveBeenCalledWith('/admin/docai/techpack-reviews/104/source-preview', expect.objectContaining({ query: { page: 2 } }))
    await wrapper.findAll('button').find(button => button.text() === 'Use PDF value')!.trigger('click')

    const [selected, ai] = await openReviewIssues(wrapper)
    expect(selected?.getAttribute('aria-pressed')).toBe('true')
    ai!.click()
    await flushPromises()
    expect(wrapper.get('section[aria-label="Selected review issue"]').text()).toContain('AI flag')
    expect(wrapper.text()).toContain('AI read')
    expect(wrapper.findAll('button').some(button => button.text() === 'Use PDF value')).toBe(false)
    expect(wrapper.text()).toContain('1 unsaved correction')
    expect(wrapper.find('[data-cell="0-1-1"]').text()).toBe('52')

    expect(wrapper.findAll('button').some(button => button.text() === 'Approve and release')).toBe(false)
    await wrapper.findAll('button').find(button => button.text() === 'Save correction')!.trigger('click')
    await flushPromises()
    expect(api).toHaveBeenCalledWith('/admin/docai/techpack-reviews/104/draft-corrections', expect.objectContaining({
      method: 'POST',
      body: { draftUuid: item.draftUuid, corrections: [{ sheetIndex: 0, rowNumber: 1, columnIndex: 1, value: '52' }] },
    }))
    wrapper.unmount()
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
    const wrapper = await mountSuspended(ReviewDetailScreen, { props: { fileId: '102' }, attachTo: document.body })
    await flushPromises()

    const [pdf] = await openReviewIssues(wrapper)
    pdf!.click()
    await flushPromises()
    await wrapper.get('section[aria-label="Selected review issue"] input').setValue('52')
    expect(wrapper.text()).toContain('1 unsaved correction')
    expect(wrapper.text()).toContain('Was 50')
    expect(wrapper.findAll('button').some(button => button.text() === 'Use PDF value')).toBe(false)
    await wrapper.findAll('button').find(button => button.text() === 'Save correction')!.trigger('click')
    await flushPromises()

    expect(api).toHaveBeenCalledWith('/admin/docai/techpack-reviews/102/draft-corrections', expect.objectContaining({
      method: 'POST',
      body: { draftUuid: item.draftUuid, corrections: [{ sheetIndex: 0, rowNumber: 1, columnIndex: 1, value: '52' }] },
    }))
    expect(api.mock.calls.filter(([url]) => url === '/admin/docai/techpack-reviews/102')).toHaveLength(2)
    expect(wrapper.text()).not.toContain('unsaved correction')
    wrapper.unmount()
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
    expect(wrapper.find('[role="checkbox"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('No issues found')
    expect(wrapper.text()).toContain('Wait for the source PDF to load.')

    await wrapper.get('img[alt^="Original TechPack PDF"]').trigger('load')
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
