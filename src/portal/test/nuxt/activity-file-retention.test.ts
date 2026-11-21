import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import type { DocAIDTO } from '../../app/types/dto'
import ActivityHistoryDetail from '../../app/pages/workspace/activity-history/[id].vue'

const { testState } = vi.hoisted(() => ({
  testState: { activityData: undefined as unknown },
}))

const defaultActivity: DocAIDTO.JobResultData = {
  jobId: 206,
  displayId: 206,
  formattedId: 'PID-00206',
  status: 'COMPLETED',
  docType: 'TECHPACK',
  files: [],
  processedBy: 'ryan@haitan-hb.com',
  totalCreditsCharged: 8000,
  totalSizeBytes: 3061842,
  processingStartedDate: '2026-09-05T15:20:00.000Z',
  processingDurationMs: 94000,
  filesExpireAt: '2026-10-05T15:20:00.000Z',
  filesDeleted: false,
}
const activityData = ref({ ...defaultActivity })
testState.activityData = activityData

mockNuxtImport('useRoute', () => () => ({
  params: { id: '206' },
  query: { from: '/workspace/activity-history' },
}))

mockNuxtImport('useProfileStore', () => () => ({
  companyId: 4653,
  refreshBalance: vi.fn(),
}))

mockNuxtImport('storeToRefs', () => () => ({
  isAuthenticated: { value: true },
  userRole: { value: 'ADMIN' },
}))

mockNuxtImport('usePermission', () => () => ({
  getRoutes: () => ['all'],
}))

mockNuxtImport('useAppToast', () => () => ({
  toast: { add: vi.fn(), addException: vi.fn() },
}))

mockNuxtImport('useAsyncData', () => () => ({
  data: testState.activityData,
  pending: { value: false },
  execute: vi.fn(),
}))

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  activityData.value = { ...defaultActivity }
})

describe('activity processing usage', () => {
  function detail(label: string) {
    return wrapper!.findAll('li').find(row => row.find('span').text() === label)
      ?.findAll('span').at(-1)?.text()
  }

  it.each([
    { extractionMethod: 'GEMINI', actualTokens: 1234, method: 'GenAI', tokens: '1234' },
    { extractionMethod: 'GEMINI', actualTokens: 0, method: 'GenAI', tokens: '0' },
    { extractionMethod: 'GEMINI', actualTokens: null, method: 'GenAI', tokens: 'Unavailable' },
    { extractionMethod: 'RULE_BASED', actualTokens: null, method: 'Rule-based', tokens: '0' },
    { extractionMethod: undefined, actualTokens: undefined, method: 'Unavailable', tokens: 'Unavailable' },
  ] as const)('displays the invoice method and usage for $extractionMethod with $actualTokens tokens', async ({ extractionMethod, actualTokens, method, tokens }) => {
    activityData.value = { ...defaultActivity, docType: 'INVOICE', extractionMethod, actualTokens, totalCreditsCharged: 0 }
    wrapper = await mountSuspended(ActivityHistoryDetail)
    expect(detail('Extraction method:')).toBe(method)
    expect(detail('Model tokens (this attempt):')).toBe(tokens)
    expect(detail('Syncra credits charged:')).toBe('0')
    expect(detail('Token Usage:')).toBeUndefined()
  })

  it('shows only recorded charges as the invoice moves from queue to debit to refund', async () => {
    activityData.value = { ...defaultActivity, docType: 'INVOICE', status: 'PENDING', totalCreditsCharged: 8 }
    wrapper = await mountSuspended(ActivityHistoryDetail)
    expect(detail('Syncra credits charged:')).toBe('Unavailable')

    activityData.value = { ...activityData.value, extractionMethod: 'GEMINI', totalCreditsCharged: 0 }
    await wrapper.vm.$nextTick()
    expect(detail('Syncra credits charged:')).toBe('0')

    activityData.value = { ...activityData.value, status: 'PROCESSING', totalCreditsCharged: 8 }
    await wrapper.vm.$nextTick()
    expect(detail('Syncra credits charged:')).toBe('8')

    activityData.value = { ...activityData.value, status: 'FAILED', totalCreditsCharged: 0 }
    await wrapper.vm.$nextTick()
    expect(detail('Syncra credits charged:')).toBe('0')
  })

  it('keeps the existing token usage for non-invoice jobs', async () => {
    wrapper = await mountSuspended(ActivityHistoryDetail)
    expect(detail('Token Usage:')).toBe('8000')
    expect(detail('Model tokens (this attempt):')).toBeUndefined()
    expect(detail('Syncra credits charged:')).toBeUndefined()
  })
})

describe('activity file retention display', () => {
  it('shows the API expiry date without a hardcoded retention period', async () => {
    wrapper = await mountSuspended(ActivityHistoryDetail)

    expect(wrapper.text()).toContain('File Expiry:')
    expect(wrapper.text()).toContain('Oct 05, 2026')
    expect(wrapper.text()).not.toContain('14 days')
  })

  it('shows no automatic deletion when the API expiry is null', async () => {
    activityData.value.filesExpireAt = null
    wrapper = await mountSuspended(ActivityHistoryDetail)

    expect(wrapper.text()).toContain('File Retention:')
    expect(wrapper.text()).toContain('No automatic deletion')
    expect(wrapper.text()).not.toContain('Jan 01, 1970')
  })
})
