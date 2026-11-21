import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import * as XLSX from 'xlsx'
import type { DocAIDTO } from '../../app/types/dto'
import ExtractionFileInfo from '../../app/features/workspace/components/ExtractionFileInfo.vue'

const testState = vi.hoisted(() => ({
  profile: { companyId: 42, canExportToErp: true },
  fileAPI: vi.fn(),
  download: vi.fn(),
  exportERP: vi.fn(),
  toast: { add: vi.fn(), addException: vi.fn() },
}))

mockNuxtImport('useProfileStore', () => () => testState.profile)
mockNuxtImport('useFileAPI', () => testState.fileAPI)
mockNuxtImport('useAppToast', () => () => ({ toast: testState.toast }))
mockNuxtImport('storeToRefs', () => () => ({
  isAuthenticated: { value: true }, userRole: { value: 'ADMIN' },
}))
mockNuxtImport('usePermission', () => () => ({ getRoutes: () => ['all'] }))

vi.mock('../../app/services/docai.service', () => ({
  exportFileToERP: testState.exportERP,
}))

vi.mock('../../app/utils/common', async importOriginal => ({
  ...await importOriginal<typeof import('../../app/utils/common')>(),
  downloadBlob: testState.download,
}))

let wrapper: VueWrapper | undefined
let file: DocAIDTO.JobFileResult
const excel = new Blob(['synthetic Excel bytes'])

async function mountFile(jobDocType = file.docType, jobStatus: DocAIDTO.DocAIJobStatus = 'COMPLETED') {
  wrapper = await mountSuspended(ExtractionFileInfo, {
    global: { stubs: { UIcon: true, Icon: true } },
    props: {
      item: {
        jobId: 70, formattedId: 'PID-00070', status: jobStatus, docType: jobDocType,
        files: [file], processedBy: 'fixture@example.test', totalSizeBytes: 20, filesDeleted: false,
      },
    },
  })
  return wrapper
}

function button(label: string) {
  const result = wrapper!.findAll('button').find(item => item.text() === label)
  expect(result, `Missing button: ${label}`).toBeDefined()
  return result!
}

beforeEach(() => {
  vi.clearAllMocks()
  testState.fileAPI.mockReset()
  testState.download.mockReset()
  testState.exportERP.mockReset()
  testState.profile.companyId = 42
  testState.profile.canExportToErp = true
  testState.fileAPI.mockResolvedValue({ file: excel, fileName: 'source.xlsx' })
  testState.exportERP.mockResolvedValue({ success: true })
  file = {
    fileId: 11, docType: 'TECHPACK', originalFilename: 'source.pdf', sizeBytes: 20,
    extractedData: '{}', excelFilename: 'fallback.xlsx', excelDownloadUrl: '/excel/11/download',
    sourcePreviewUrl: null, sourceDownloadUrl: null,
  }
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('DocAI workbook preview', () => {
  it('renders cells with their Excel number formats', async () => {
    file.docType = 'INVOICE'
    const invoice = XLSX.utils.aoa_to_sheet([
      ['Invoice Date', 46160],
      ['Amount', 7107.3],
      ['Quantity', 46160],
    ])
    invoice.B1.z = 'yyyy-mm-dd'
    invoice.B2.z = '#,##0.00'
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, invoice, 'Invoice')
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    testState.fileAPI.mockResolvedValue({ file: new Blob([bytes]), fileName: 'invoice.xlsx' })

    await mountFile()
    await button('Preview').trigger('click')
    await vi.waitFor(() => {
      const values = document.querySelectorAll('[role="dialog"] td:nth-child(2)')
      expect(Array.from(values, cell => cell.textContent?.trim())).toEqual(['2026-05-18', '7,107.30', '46160'])
    })
  })
})

describe('DocAI Download & Export to ERP', () => {
  it('shows a released workbook as complete when another file in the job failed', async () => {
    file = { ...file, extractedData: null, verificationPending: false, status: 'COMPLETED' }
    const view = await mountFile('TECHPACK', 'FAILED')
    expect(view.find('li').classes()).toContain('border-l-success-500')
    expect(button('Download & Export to ERP').attributes('disabled')).toBeUndefined()
  })

  it('downloads the original Excel before invoking the scoped backend export', async () => {
    await mountFile()
    expect(wrapper!.text()).not.toContain('Export to ERP System')
    await button('Download & Export to ERP').trigger('click')
    await vi.waitFor(() => expect(testState.exportERP).toHaveBeenCalledTimes(1))
    expect(testState.fileAPI).toHaveBeenCalledWith('/excel/11/download')
    expect(testState.download).toHaveBeenCalledWith(excel, 'source.xlsx')
    expect(testState.exportERP).toHaveBeenCalledWith({ companyId: 42, jobId: 70, fileId: 11 })
    expect(testState.download.mock.invocationCallOrder[0]).toBeLessThan(testState.exportERP.mock.invocationCallOrder[0]!)
    await vi.waitFor(() => expect(testState.toast.add).toHaveBeenCalledWith('success', expect.objectContaining({
      title: 'Download & Export Successful',
    })))
  })

  it('preserves the fallback download filename when the server omits it', async () => {
    testState.fileAPI.mockResolvedValue({ file: excel, fileName: 'unknown' })
    await mountFile()
    await button('Download & Export to ERP').trigger('click')
    await vi.waitFor(() => expect(testState.download).toHaveBeenCalledWith(excel, 'fallback.xlsx'))
  })

  it('keeps a plain download and never exports for a company without ERP access', async () => {
    testState.profile.canExportToErp = false
    await mountFile()
    expect(wrapper!.text()).not.toContain('Download & Export to ERP')
    await button('Download Spreadsheet').trigger('click')
    await vi.waitFor(() => expect(testState.download).toHaveBeenCalledTimes(1))
    expect(testState.exportERP).not.toHaveBeenCalled()
  })

  it.each(['INVOICE', 'PURCHASE_ORDER'])('keeps %s downloads separate from ERP for an ERP-enabled company', async (docType) => {
    file.docType = docType
    await mountFile()
    expect(wrapper!.text()).not.toContain('Download & Export to ERP')
    expect(wrapper!.text()).not.toContain('Retry ERP Export')
    await button('Download Spreadsheet').trigger('click')
    await vi.waitFor(() => expect(testState.download).toHaveBeenCalledWith(excel, 'source.xlsx'))
    expect(testState.fileAPI).toHaveBeenCalledWith('/excel/11/download')
    expect(testState.exportERP).not.toHaveBeenCalled()
  })

  it('uses the file type rather than the parent job type for ERP eligibility', async () => {
    file.docType = 'INVOICE'
    await mountFile('TECHPACK')
    expect(wrapper!.text()).not.toContain('Download & Export to ERP')
    await button('Download Spreadsheet').trigger('click')
    await vi.waitFor(() => expect(testState.download).toHaveBeenCalledTimes(1))
    expect(testState.exportERP).not.toHaveBeenCalled()
  })

  it('does not export when fetching the Excel fails', async () => {
    const error = { data: { detail: 'Excel output file not found' } }
    testState.fileAPI.mockRejectedValueOnce(error)
    await mountFile()
    await button('Download & Export to ERP').trigger('click')
    await vi.waitFor(() => expect(testState.toast.addException).toHaveBeenCalledWith(error))
    expect(testState.download).not.toHaveBeenCalled()
    expect(testState.exportERP).not.toHaveBeenCalled()
    expect(button('Download & Export to ERP').attributes('disabled')).toBeUndefined()
  })

  it('shows the ERP failure after downloading and retries only the export', async () => {
    testState.exportERP.mockRejectedValueOnce({ data: { detail: 'ERP rejected the workbook' } })
    await mountFile()
    await button('Download & Export to ERP').trigger('click')
    await vi.waitFor(() => expect(wrapper!.text()).toContain('ERP rejected the workbook'))
    expect(testState.download).toHaveBeenCalledTimes(1)
    expect(testState.toast.add).toHaveBeenCalledWith('error', expect.objectContaining({
      title: 'ERP Export Failed', description: expect.stringContaining('ERP rejected the workbook'),
    }))
    await button('Retry ERP Export').trigger('click')
    await vi.waitFor(() => expect(testState.exportERP).toHaveBeenCalledTimes(2))
    expect(testState.download).toHaveBeenCalledTimes(1)
    expect(testState.fileAPI).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(wrapper!.text()).not.toContain('Retry ERP Export'))
  })

  it('does not export if the browser download cannot be started', async () => {
    const error = new Error('Download could not be started')
    testState.download.mockImplementationOnce(() => {
      throw error
    })
    await mountFile()
    await button('Download & Export to ERP').trigger('click')
    await vi.waitFor(() => expect(testState.toast.addException).toHaveBeenCalledWith(error))
    expect(testState.exportERP).not.toHaveBeenCalled()
  })

  it('never exports when previewing the Excel', async () => {
    await mountFile()
    await button('Preview').trigger('click')
    await vi.waitFor(() => expect(testState.fileAPI).toHaveBeenCalledTimes(1))
    expect(testState.exportERP).not.toHaveBeenCalled()
    expect(testState.download).not.toHaveBeenCalled()
  })

  it('blocks duplicate clicks throughout download and ERP submission', async () => {
    const download = Promise.withResolvers<{ file: Blob, fileName: string }>()
    const exportERP = Promise.withResolvers<{ success: boolean }>()
    testState.fileAPI.mockReturnValueOnce(download.promise)
    testState.exportERP.mockReturnValueOnce(exportERP.promise)
    await mountFile()
    await button('Download & Export to ERP').trigger('click')
    await button('Download & Export to ERP').trigger('click')
    expect(testState.fileAPI).toHaveBeenCalledTimes(1)
    expect(button('Download & Export to ERP').attributes('disabled')).toBeDefined()
    expect(button('Delete').attributes('disabled')).toBeDefined()
    download.resolve({ file: excel, fileName: 'source.xlsx' })
    await vi.waitFor(() => expect(testState.exportERP).toHaveBeenCalledTimes(1))
    await button('Download & Export to ERP').trigger('click')
    expect(testState.exportERP).toHaveBeenCalledTimes(1)
    exportERP.resolve({ success: true })
    await vi.waitFor(() => expect(button('Download & Export to ERP').attributes('disabled')).toBeUndefined())
  })

  it('preserves the timeout warning and does not retry automatically', async () => {
    const warning = 'ERP did not respond before the timeout. The file may already have been received. Please verify in ERP before retrying.'
    testState.exportERP.mockRejectedValueOnce({ data: { detail: warning } })
    await mountFile()
    await button('Download & Export to ERP').trigger('click')
    await vi.waitFor(() => expect(wrapper!.text()).toContain(warning))
    expect(testState.exportERP).toHaveBeenCalledTimes(1)
    expect(testState.download).toHaveBeenCalledTimes(1)
  })

  it('uses the company and job selected when the combined action starts', async () => {
    const pending = Promise.withResolvers<{ file: Blob, fileName: string }>()
    testState.fileAPI.mockReturnValueOnce(pending.promise)
    await mountFile()
    await button('Download & Export to ERP').trigger('click')
    testState.profile.companyId = 99
    pending.resolve({ file: excel, fileName: 'source.xlsx' })
    await vi.waitFor(() => expect(testState.exportERP).toHaveBeenCalledWith({ companyId: 42, jobId: 70, fileId: 11 }))
  })

  it.each(['deleted', 'unavailable'])('hides actions for an %s file', async (state) => {
    if (state === 'deleted') file.deleted = true
    else file.excelDownloadUrl = null
    await mountFile()
    expect(wrapper!.text()).not.toContain('Download & Export to ERP')
    expect(testState.fileAPI).not.toHaveBeenCalled()
    expect(testState.exportERP).not.toHaveBeenCalled()
  })
})
