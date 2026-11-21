import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, reactive } from 'vue'
import type { DocAIDTO } from '../../app/types/dto'
import WorkspaceCreate from '../../app/pages/workspace/create.vue'

const testState = vi.hoisted(() => ({
  route: { query: { type: 'INVOICE' } },
  api: vi.fn(),
  profile: { companyId: 42, tokenBalance: { balance: 100 }, refreshBalance: vi.fn() },
  toast: { add: vi.fn(), addException: vi.fn() },
}))

mockNuxtImport('useRoute', () => () => testState.route)
mockNuxtImport('useProfileStore', () => () => testState.profile)
mockNuxtImport('useAPI', () => testState.api)
mockNuxtImport('useAppToast', () => () => ({ toast: testState.toast }))
mockNuxtImport('storeToRefs', () => () => ({
  isAuthenticated: { value: true }, userRole: { value: 'ADMIN' },
}))
mockNuxtImport('usePermission', () => () => ({ getRoutes: () => ['all'] }))

const ModalContent = defineComponent({
  props: { open: Boolean },
  emits: ['update:open'],
  setup(props, { slots, emit }) {
    return () => props.open && h('div', { role: 'dialog' }, slots.default?.({
      close: () => emit('update:open', false),
    }))
  },
})

type APIOptions = {
  method?: string
  body?: FormData
  query?: { type?: DocAIDTO.DocType, draftOnly?: boolean, expectedFileId?: number }
}
type RequestHandler = (path: string, options: APIOptions) => unknown

let wrapper: VueWrapper | undefined
let staged: DocAIDTO.JobFile[]
let status: DocAIDTO.DocAIJobStatus
let fileError: string | null
let jobId: number
let rejectUpload: boolean
let draftExists: boolean
const requestOverrides = new Map<string, RequestHandler>()

function respond(data: unknown) {
  return { success: true, data }
}

function summary(): DocAIDTO.JobSummary {
  return {
    jobId,
    formattedId: 'PID-00070',
    status: 'DRAFT',
    docType: testState.route.query.type,
    fileCount: staged.length,
    totalEstimatedSeconds: 20,
    totalRequiredCredits: 10,
  }
}

function button(label: string | RegExp) {
  const buttons = wrapper!.findAll('button')
  const found = buttons.find(item => typeof label === 'string' ? item.text() === label : label.test(item.text()))
  expect(found, `Missing button ${label}`).toBeDefined()
  return found!
}

async function mountWorkspace() {
  wrapper = await mountSuspended(WorkspaceCreate, {
    global: { stubs: { UIcon: true, Icon: true, ModalContent } },
  })
  await flushPromises()
  return wrapper
}

async function selectFile(extension: string, filename: string, size?: number) {
  const field = wrapper!.get<HTMLInputElement>(`input[type="file"][accept="${extension}"]`)
  const file = new File(['fixture'], filename)
  if (size)
    Object.defineProperty(file, 'size', { value: size })
  Object.defineProperty(field.element, 'files', {
    configurable: true,
    value: [file],
  })
  await field.trigger('change')
  return file
}

function fileUploads() {
  return testState.api.mock.calls.filter(([path, options]: [string, APIOptions]) =>
    path.endsWith('/files') && options.method === 'POST')
}

function finalizations() {
  return testState.api.mock.calls.filter(([path]: [string]) => path.endsWith('/finalize'))
}

function deferredResponse() {
  let resolve!: (value: unknown) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function invoiceSet(fileId: number, filename: string, packingFilename?: string): DocAIDTO.JobFile {
  return {
    fileId, docType: 'INVOICE', originalFilename: filename, sizeBytes: 100,
    attachments: packingFilename ? [{ role: 'packing_list', originalFilename: packingFilename }] : [],
  }
}

beforeEach(() => {
  testState.route = reactive({ query: { type: 'INVOICE' } })
  testState.profile = reactive({ ...testState.profile, companyId: 42, tokenBalance: { balance: 100 } })
  staged = []
  status = 'COMPLETED'
  fileError = null
  jobId = 70
  rejectUpload = false
  draftExists = true
  requestOverrides.clear()
  testState.toast.add.mockClear()
  testState.toast.addException.mockClear()
  testState.profile.refreshBalance.mockReset()
  testState.api.mockReset().mockImplementation(async (path: string, options: APIOptions) => {
    const override = requestOverrides.get(`${options.method} ${path}`)
    if (override)
      return override(path, options)

    if (path.endsWith('/jobs') && options.method === 'POST')
      return respond(summary())

    if (path.endsWith('/jobs/draft') && options.method === 'GET')
      return respond(draftExists ? summary() : null)

    if (path.endsWith('/files') && options.method === 'GET')
      return respond({ job: summary(), files: staged })

    if (path.endsWith('/files') && options.method === 'POST') {
      if (rejectUpload) return { success: false, reason: 'Unable to store the invoice set.' }

      const body = options.body!
      const files = Array.from(body.values()).filter((part): part is File => typeof part !== 'string')
      const mainFile = (body.get('mainFile') ?? body.get('files')) as File
      const attachments = Array.from(body.entries())
        .filter(([role, value]) => (role === 'packing_list' || role === 'fabric_rolls') && typeof value !== 'string')
        .map(([role, file]) => ({ role, originalFilename: (file as File).name }))
      staged = [{
        docType: testState.route.query.type,
        fileId: 17,
        originalFilename: mainFile.name,
        attachments,
        sizeBytes: files.reduce((total, file) => total + file.size, 0),
      }]
      return respond({ job: summary(), files: staged })
    }

    if (path.endsWith('/files/17') && options.method === 'DELETE') {
      staged = []
      return respond({ job: summary(), files: staged })
    }

    if (path.endsWith('/finalize') && options.method === 'POST')
      return respond({ ...summary(), status: 'PENDING' })

    if (path.endsWith('/status') && options.method === 'GET')
      return respond({ jobId, status, progress: 100, errorMessage: null })

    if (path.endsWith('/result') && options.method === 'GET') {
      const result = {
        ...summary(),
        status,
        files: staged.map(file => ({
          ...file,
          errorMessage: fileError,
          extractedData: fileError ? null : '{}',
          excelDownloadUrl: fileError ? null : '/excel/17/download',
          sourcePreviewUrl: null,
          sourceDownloadUrl: null,
        })),
        processedBy: 'fixture@example.test',
        filesDeleted: false,
      }
      jobId++
      staged = []
      return respond(result)
    }

    throw new Error(`Unexpected API call ${options.method} ${path}`)
  })
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.restoreAllMocks()
})

describe('workspace invoice sets', () => {
  it('stages a single combined PDF when processing a complete selection', async () => {
    await mountWorkspace()
    expect(button('Process').attributes('disabled')).toBeDefined()
    expect(wrapper!.text()).toContain('Choose a combined PDF.')
    await selectFile('.pdf', 'combined.PDF')
    expect(button('Process').attributes('disabled')).toBeUndefined()
    expect(fileUploads()).toHaveLength(0)

    await button('Process').trigger('click')
    await vi.waitFor(() => expect(wrapper!.get('[role="dialog"]').text()).toContain('combined.PDF'))
    expect(fileUploads()).toHaveLength(1)
    const [path, request] = fileUploads()[0]!
    expect(path).toBe('/companies/42/docai/jobs/70/files')
    expect(request.query).toEqual({ type: 'INVOICE' })
    expect(request.body.get('mode')).toBe('combined')
    expect(request.body.get('mainFile').name).toBe('combined.PDF')
    expect(request.body.has('packing_list')).toBe(false)
    expect(request.body.has('fabric_rolls')).toBe(false)
    expect(request.body.has('files')).toBe(false)
    expect(finalizations()).toHaveLength(0)

    await button(/^Confirm /).trigger('click')
    await vi.waitFor(() => expect(button('Download Spreadsheet').exists()).toBe(true))
    expect(button('Preview').exists()).toBe(true)
    expect(finalizations()).toHaveLength(1)
    expect(finalizations()[0]![1].query).toEqual({ expectedFileId: 17 })
  })

  it('stages a packing PDF and an optional roll PDF with the invoice', async () => {
    await mountWorkspace()
    await wrapper!.get('input[value="separate"]').setValue(true)
    await selectFile('.pdf', 'invoice.pdf')
    await selectFile('.pdf,.xlsx', 'packing.pdf')
    expect(button('Process').attributes('disabled')).toBeUndefined()

    const rollField = wrapper!.get<HTMLInputElement>('#invoice-upload-rolls')
    const rolls = new File(['fixture'], 'rolls.pdf')
    Object.defineProperty(rollField.element, 'files', { configurable: true, value: [rolls] })
    await rollField.trigger('change')

    await button('Process').trigger('click')
    await vi.waitFor(() => expect(wrapper!.get('[role="dialog"]').text()).toContain('rolls.pdf'))
    const body = fileUploads()[0]![1].body
    expect(body.get('mode')).toBe('separate')
    expect(body.get('mainFile').name).toBe('invoice.pdf')
    expect(body.get('packing_list').name).toBe('packing.pdf')
    expect(body.get('fabric_rolls').name).toBe('rolls.pdf')
    expect(body.has('files')).toBe(false)
  })

  it('accepts a packing PDF dropped on the packing field', async () => {
    await mountWorkspace()
    await wrapper!.get('input[value="separate"]').setValue(true)
    await selectFile('.pdf', 'invoice.pdf')

    const packing = new File(['fixture'], 'dropped-packing.pdf')
    await wrapper!.get('#invoice-upload-packing').trigger('drop', { dataTransfer: { files: [packing] } })

    expect(wrapper!.text()).toContain('dropped-packing.pdf')
    expect(button('Process').attributes('disabled')).toBeUndefined()
  })

  it('requires both separate files and sends them in the same request', async () => {
    await mountWorkspace()
    await wrapper!.get('input[value="separate"]').setValue(true)
    expect(wrapper!.text()).toContain('Choose an invoice PDF and a packing list PDF or XLSX.')
    expect(button('Process').attributes('disabled')).toBeDefined()

    await selectFile('.pdf,.xlsx', 'packing.XLSX')
    expect(wrapper!.text()).toContain('Choose an invoice PDF.')
    expect(button('Process').attributes('disabled')).toBeDefined()
    expect(fileUploads()).toHaveLength(0)

    await selectFile('.pdf', 'invoice.pdf')
    await button('Process').trigger('click')
    await vi.waitFor(() => expect(wrapper!.get('[role="dialog"]').text()).toContain('packing.XLSX'))
    expect(fileUploads()).toHaveLength(1)
    const body = fileUploads()[0]![1].body
    expect(body.get('mode')).toBe('separate')
    expect(body.get('mainFile').name).toBe('invoice.pdf')
    expect(body.get('packing_list').name).toBe('packing.XLSX')
    expect(body.has('fabric_rolls')).toBe(false)
  })

  it('clears the PDF from the previous mode and rejects a mislabeled packing file', async () => {
    await mountWorkspace()
    await selectFile('.pdf', 'combined.pdf')
    await wrapper!.get('input[value="separate"]').setValue(true)
    await selectFile('.pdf', 'invoice.pdf')
    await selectFile('.pdf,.xlsx', 'packing.xls')
    expect(wrapper!.text()).toContain('Choose a packing list PDF or XLSX.')
    expect(button('Process').attributes('disabled')).toBeDefined()
    expect(fileUploads()).toHaveLength(0)

    await selectFile('.pdf,.xlsx', 'packing.xlsx')
    expect(button('Process').attributes('disabled')).toBeUndefined()
  })

  it('retains both selections after the server rejects staging', async () => {
    await mountWorkspace()
    await wrapper!.get('input[value="separate"]').setValue(true)
    await selectFile('.pdf', 'invoice.pdf')
    await selectFile('.pdf,.xlsx', 'packing.xlsx')
    rejectUpload = true
    await button('Process').trigger('click')
    await vi.waitFor(() => expect(button('Process').attributes('disabled')).toBeUndefined())
    expect(wrapper!.find('[role="dialog"]').exists()).toBe(false)
    expect(finalizations()).toHaveLength(0)

    rejectUpload = false
    await button('Process').trigger('click')
    await vi.waitFor(() => expect(wrapper!.get('[role="dialog"]').text()).toContain('packing.xlsx'))
    expect(fileUploads()).toHaveLength(2)
    const requestIds = fileUploads().map(([, options]) => options.body.get('uploadRequestId'))
    expect(requestIds[0]).toEqual(expect.any(String))
    expect(requestIds[1]).toBe(requestIds[0])
    const body = fileUploads()[1]![1].body
    expect(body.get('mainFile').name).toBe('invoice.pdf')
    expect(body.get('packing_list').name).toBe('packing.xlsx')
  })

  it('displays every attachment on a restored set and allows removing the set', async () => {
    staged = [{
      ...invoiceSet(17, 'saved-invoice.pdf'),
      attachments: [
        { role: 'packing_list', originalFilename: 'saved-packing.xlsx' },
        { role: 'other_role', originalFilename: 'extra.pdf' },
      ],
    }]
    await mountWorkspace()
    expect(wrapper!.text()).toContain('saved-invoice.pdf')
    expect(wrapper!.text()).toContain('saved-packing.xlsx')
    expect(wrapper!.text()).toContain('extra.pdf')
    expect(button('Process').attributes('disabled')).toBeUndefined()
    expect(wrapper!.find('input[type="file"]').exists()).toBe(false)

    await wrapper!.get('button[aria-label="Remove invoice set"]').trigger('click')
    await vi.waitFor(() => expect(button('Process').attributes('disabled')).toBeDefined())
    expect(wrapper!.find('input[type="file"]').exists()).toBe(true)
    expect(fileUploads()).toHaveLength(0)
    expect(testState.api).toHaveBeenCalledWith('/companies/42/docai/jobs/70/files/17', {
      method: 'DELETE', query: { draftOnly: true },
    })
  })

  it.each([
    { extension: '.pdf', filename: 'corrected-invoice.pdf' },
    { extension: '.pdf,.xlsx', filename: 'corrected-packing.xlsx' },
  ])('retains the other file when replacing $extension after a worker mismatch', async ({ extension, filename }) => {
    await mountWorkspace()
    status = 'FAILED'
    fileError = 'Invoice and packing list numbers do not match.'
    await wrapper!.get('input[value="separate"]').setValue(true)
    const invoice = await selectFile('.pdf', 'invoice.pdf')
    const packing = await selectFile('.pdf,.xlsx', 'mismatched-packing.xlsx')
    await button('Process').trigger('click')
    await vi.waitFor(() => expect(wrapper!.find('[role="dialog"]').exists()).toBe(true))
    await button(/^Confirm /).trigger('click')
    await vi.waitFor(() => expect(wrapper!.text()).toContain(fileError))
    expect(wrapper!.text()).not.toContain('Download Spreadsheet')

    await button('Replace files and try again').trigger('click')
    await vi.waitFor(() => expect(wrapper!.find('#invoice-upload-packing').exists()).toBe(true))
    expect(wrapper!.text()).toContain('invoice.pdf')
    expect(wrapper!.text()).toContain('mismatched-packing.xlsx')
    const corrected = await selectFile(extension, filename)
    await button('Process').trigger('click')
    await vi.waitFor(() => expect(wrapper!.get('[role="dialog"]').text()).toContain(filename))
    expect(fileUploads()[1]![0]).toBe('/companies/42/docai/jobs/71/files')
    const retryBody = fileUploads()[1]![1].body
    expect(retryBody.get('mainFile')).toBe(extension === '.pdf' ? corrected : invoice)
    expect(retryBody.get('packing_list')).toBe(extension === '.pdf,.xlsx' ? corrected : packing)
  })

  it('prompts for both originals after processing a restored separate draft fails', async () => {
    staged = [invoiceSet(17, 'saved-invoice.pdf', 'saved-packing.xlsx')]
    status = 'FAILED'
    fileError = 'Invoice and packing list numbers do not match.'
    await mountWorkspace()
    await button('Process').trigger('click')
    await button(/^Confirm /).trigger('click')
    await vi.waitFor(() => expect(wrapper!.text()).toContain(fileError))
    await button('Replace files and try again').trigger('click')
    await vi.waitFor(() => expect(wrapper!.text()).toContain('Choose an invoice PDF and a packing list PDF or XLSX.'))
    expect(button('Process').attributes('disabled')).toBeDefined()
  })

  it('leaves room for multipart overhead when validating a separate set', async () => {
    await mountWorkspace()
    await wrapper!.get('input[value="separate"]').setValue(true)
    await selectFile('.pdf', 'invoice.pdf', 25 * 1024 * 1024)
    await selectFile('.pdf,.xlsx', 'packing.xlsx', 25 * 1024 * 1024)
    expect(button('Process').attributes('disabled')).toBeDefined()
    expect(wrapper!.get('#invoice-selection-hint').text()).toContain('49')
    expect(fileUploads()).toHaveLength(0)

    await selectFile('.pdf,.xlsx', 'smaller-packing.xlsx', 24 * 1024 * 1024)
    expect(button('Process').attributes('disabled')).toBeUndefined()
  })

  it('retains the originals from a staged upload whose response was lost', async () => {
    status = 'FAILED'
    fileError = 'Invoice and packing list numbers do not match.'
    requestOverrides.set('POST /companies/42/docai/jobs/70/files', (_path, { body }) => {
      const requestId = body!.get('uploadRequestId') as string | null
      staged = [{ ...invoiceSet(17, 'sent.pdf', 'packing.xlsx'), uploadRequestId: requestId }]
      throw new Error('Connection closed after staging')
    })
    await mountWorkspace()
    await wrapper!.get('input[value="separate"]').setValue(true)
    await selectFile('.pdf', 'sent.pdf')
    const packing = await selectFile('.pdf,.xlsx', 'packing.xlsx')
    await button('Process').trigger('click')
    await vi.waitFor(() => expect(wrapper!.text()).toContain('Uploaded successfully'))
    expect(fileUploads()[0]![1].body.get('uploadRequestId')).toEqual(expect.stringMatching(
      /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i,
    ))
    expect(wrapper!.find('[role="dialog"]').exists()).toBe(false)
    await button('Process').trigger('click')
    expect(wrapper!.get('[role="dialog"]').text()).toContain('sent.pdf')
    expect(fileUploads()).toHaveLength(1)
    await button(/^Confirm /).trigger('click')
    await vi.waitFor(() => expect(wrapper!.text()).toContain(fileError))

    await button('Replace files and try again').trigger('click')
    await vi.waitFor(() => expect(wrapper!.find('#invoice-upload-packing').exists()).toBe(true))
    const corrected = await selectFile('.pdf', 'corrected.pdf')
    await button('Process').trigger('click')
    await vi.waitFor(() => expect(fileUploads()).toHaveLength(2))
    const retryBody = fileUploads()[1]![1].body
    expect(retryBody.get('mainFile')).toBe(corrected)
    expect(retryBody.get('packing_list')).toBe(packing)
  })

  it('does not retain originals from a different upload with matching filenames', async () => {
    status = 'FAILED'
    fileError = 'Invoice and packing list numbers do not match.'
    requestOverrides.set('POST /companies/42/docai/jobs/70/files', () => {
      staged = [{
        ...invoiceSet(17, 'sent.pdf', 'packing.xlsx'),
        uploadRequestId: '00000000-0000-4000-8000-000000000000',
      }]
      throw new Error('Connection closed before staging')
    })
    await mountWorkspace()
    await wrapper!.get('input[value="separate"]').setValue(true)
    await selectFile('.pdf', 'sent.pdf')
    await selectFile('.pdf,.xlsx', 'packing.xlsx')
    await button('Process').trigger('click')
    await vi.waitFor(() => expect(wrapper!.text()).toContain('Uploaded successfully'))
    await button('Process').trigger('click')
    await button(/^Confirm /).trigger('click')
    await vi.waitFor(() => expect(wrapper!.text()).toContain(fileError))

    await button('Replace files and try again').trigger('click')
    await vi.waitFor(() => expect(wrapper!.text()).toContain('Choose an invoice PDF and a packing list PDF or XLSX.'))
  })

  it('recovers a committed finalize when its response is lost', async () => {
    staged = [invoiceSet(17, 'sent.pdf')]
    requestOverrides.set('POST /companies/42/docai/jobs/70/finalize', () => {
      if (draftExists) {
        draftExists = false
        throw new Error('Connection closed after finalizing')
      }
      return respond({ ...summary(), status: 'PENDING' })
    })
    await mountWorkspace()
    await button('Process').trigger('click')
    await button(/^Confirm /).trigger('click')

    await vi.waitFor(() => expect(wrapper!.text()).toContain('Download Spreadsheet'))
    expect(finalizations().map(([path, options]) => [path, options.query])).toEqual([
      ['/companies/42/docai/jobs/70/finalize', { expectedFileId: 17 }],
      ['/companies/42/docai/jobs/70/finalize', { expectedFileId: 17 }],
    ])
    expect(fileUploads()).toHaveLength(0)
  })

  it('keeps the reviewed set available if both finalize responses are inconclusive', async () => {
    staged = [invoiceSet(17, 'sent.pdf')]
    requestOverrides.set('POST /companies/42/docai/jobs/70/finalize', () => {
      draftExists = false
      throw new Error('Connection closed after finalizing')
    })
    await mountWorkspace()
    await button('Process').trigger('click')
    await button(/^Confirm /).trigger('click')
    await vi.waitFor(() => expect(finalizations()).toHaveLength(2))
    expect(wrapper!.get('[role="dialog"]').text()).toContain('sent.pdf')
    await button('Cancel').trigger('click')
    expect(wrapper!.get('button[aria-label="Remove invoice set"]').attributes('disabled')).toBeDefined()
    await button('Process').trigger('click')

    requestOverrides.delete('POST /companies/42/docai/jobs/70/finalize')
    await button(/^Confirm /).trigger('click')
    await vi.waitFor(() => expect(wrapper!.text()).toContain('Download Spreadsheet'))
    expect(finalizations()[2]![1].query).toEqual({ expectedFileId: 17 })
  })

  it('keeps the original submission if the recovery request loses authorization', async () => {
    staged = [invoiceSet(17, 'sent.pdf')]
    requestOverrides.set('POST /companies/42/docai/jobs/70/finalize', () => {
      if (draftExists) {
        draftExists = false
        throw new Error('Connection closed after finalizing')
      }
      throw Object.assign(new Error('Authorization expired'), { statusCode: 401 })
    })
    await mountWorkspace()
    await button('Process').trigger('click')
    await button(/^Confirm /).trigger('click')

    await vi.waitFor(() => expect(wrapper!.get('[role="dialog"]').text()).toContain('Submission could not be verified.'))
    expect(finalizations()).toHaveLength(2)
    expect(fileUploads()).toHaveLength(0)
  })

  it('shows that an incomplete removal must be retried before processing', async () => {
    staged = [invoiceSet(17, 'sent.pdf', 'packing.xlsx')]
    requestOverrides.set('DELETE /companies/42/docai/jobs/70/files/17', () => {
      staged = [{ ...staged[0]!, status: 'FAILED' }]
      requestOverrides.delete('DELETE /companies/42/docai/jobs/70/files/17')
      throw Object.assign(new Error('Unable to finish removing the invoice set'), { statusCode: 500 })
    })
    await mountWorkspace()
    await wrapper!.get('button[aria-label="Remove invoice set"]').trigger('click')
    await vi.waitFor(() => expect(wrapper!.text()).toContain('Retry removing the invoice set before processing.'))
    expect(button('Process').attributes('disabled')).toBeDefined()
    expect(wrapper!.text()).not.toContain('Uploaded successfully')
    await wrapper!.get('button[aria-label="Retry removing invoice set"]').trigger('click')
    await vi.waitFor(() => expect(wrapper!.find('input[accept=".pdf"]').exists()).toBe(true))
    expect(wrapper!.text()).not.toContain('packing.xlsx')
    expect(finalizations()).toHaveLength(0)
  })

  it('closes stale confirmation and requires approval for the replacement invoice set', async () => {
    staged = [invoiceSet(17, 'reviewed.pdf')]
    requestOverrides.set('POST /companies/42/docai/jobs/70/finalize', () => {
      staged = [invoiceSet(18, 'replacement.pdf')]
      requestOverrides.delete('POST /companies/42/docai/jobs/70/finalize')
      throw Object.assign(new Error('The invoice set changed'), { statusCode: 409 })
    })
    await mountWorkspace()
    await button('Process').trigger('click')
    expect(wrapper!.get('[role="dialog"]').text()).toContain('reviewed.pdf')
    await button(/^Confirm /).trigger('click')
    await vi.waitFor(() => expect(wrapper!.text()).toContain('replacement.pdf'))
    expect(wrapper!.find('[role="dialog"]').exists()).toBe(false)
    expect(finalizations().map(([, options]) => options.query)).toEqual([{ expectedFileId: 17 }])

    await button('Process').trigger('click')
    expect(wrapper!.get('[role="dialog"]').text()).toContain('replacement.pdf')
    await button(/^Confirm /).trigger('click')
    await vi.waitFor(() => expect(finalizations()).toHaveLength(2))
    expect(finalizations()[1]![1].query).toEqual({ expectedFileId: 18 })
  })

  it('removes stale draft controls when another session finalized the job', async () => {
    staged = [invoiceSet(17, 'finalized.pdf')]
    requestOverrides.set('DELETE /companies/42/docai/jobs/70/files/17', () => {
      draftExists = false
      throw Object.assign(new Error('The job is already finalized'), { statusCode: 409 })
    })
    await mountWorkspace()
    await wrapper!.get('button[aria-label="Remove invoice set"]').trigger('click')
    await vi.waitFor(() => expect(wrapper!.find('button[aria-label="Remove invoice set"]').exists()).toBe(false))
    expect(button('Process').attributes('disabled')).toBeDefined()
    expect(staged[0]?.originalFilename).toBe('finalized.pdf')
  })

  it('offers a safe retry when the latest draft cannot be loaded after a conflict', async () => {
    staged = [invoiceSet(17, 'old.pdf')]
    requestOverrides.set('DELETE /companies/42/docai/jobs/70/files/17', () => {
      staged = [invoiceSet(18, 'replacement.pdf')]
      throw Object.assign(new Error('File changed'), { statusCode: 409 })
    })
    requestOverrides.set('GET /companies/42/docai/jobs/draft', () => {
      throw new Error('Connection interrupted')
    })
    await mountWorkspace()
    await wrapper!.get('button[aria-label="Remove invoice set"]').trigger('click')
    await vi.waitFor(() => expect(button('Reload invoice draft').exists()).toBe(true))
    expect(wrapper!.find('button[aria-label="Remove invoice set"]').exists()).toBe(false)
    expect(wrapper!.find('[role="dialog"]').exists()).toBe(false)

    requestOverrides.delete('GET /companies/42/docai/jobs/draft')
    await button('Reload invoice draft').trigger('click')
    await vi.waitFor(() => expect(wrapper!.text()).toContain('replacement.pdf'))
    expect(wrapper!.text()).not.toContain('old.pdf')
  })

  it.each([
    { operation: 'init', request: 'POST /companies/42/docai/jobs' },
    { operation: 'draft list', request: 'GET /companies/42/docai/jobs/70/files' },
    { operation: 'remove', request: 'DELETE /companies/42/docai/jobs/70/files/17' },
    { operation: 'finalize', request: 'POST /companies/42/docai/jobs/70/finalize' },
    { operation: 'status', request: 'GET /companies/42/docai/70/status' },
  ])('ignores an in-flight $operation response when the company changes', async ({ operation, request }) => {
    const pending = deferredResponse()
    const [method, path] = request.split(' ')
    staged = [invoiceSet(17, 'old-company.pdf')]
    const oldJob = summary()
    const oldFiles = staged
    requestOverrides.set(request, () => pending.promise)
    await mountWorkspace()
    if (operation === 'remove') {
      await wrapper!.get('button[aria-label="Remove invoice set"]').trigger('click')
    }
    if (operation === 'finalize' || operation === 'status') {
      await button('Process').trigger('click')
      await button(/^Confirm /).trigger('click')
    }
    await vi.waitFor(() => expect(testState.api).toHaveBeenCalledWith(path, expect.objectContaining({ method })))

    staged = [invoiceSet(18, 'new-company.pdf')]
    testState.profile.companyId = 43
    await vi.waitFor(() => expect(wrapper!.text()).toContain('new-company.pdf'))
    pending.resolve(respond(operation === 'init'
      ? oldJob
      : operation === 'finalize' || operation === 'status'
        ? { ...oldJob, status: 'COMPLETED' }
        : { job: oldJob, files: oldFiles }))
    await flushPromises()

    expect(wrapper!.text()).not.toContain('old-company.pdf')
    expect(wrapper!.find('[role="dialog"]').exists()).toBe(false)
    expect(button('Process').attributes('disabled')).toBeUndefined()
    expect(testState.api).not.toHaveBeenCalledWith('/companies/42/docai/70/result', { method: 'GET' })
    expect(testState.api).not.toHaveBeenCalledWith('/companies/43/docai/70/status', { method: 'GET' })
    if (operation === 'init')
      expect(testState.api).not.toHaveBeenCalledWith('/companies/42/docai/jobs/70/files', { method: 'GET' })
  })

  it('ignores an in-flight upload when the company changes', async () => {
    const pending = deferredResponse()
    requestOverrides.set('POST /companies/42/docai/jobs/70/files', () => pending.promise)
    await mountWorkspace()
    await selectFile('.pdf', 'old-company.pdf')
    await button('Process').trigger('click')
    await vi.waitFor(() => expect(fileUploads()).toHaveLength(1))

    staged = [invoiceSet(18, 'new-company.pdf')]
    testState.profile.companyId = 43
    await vi.waitFor(() => expect(wrapper!.text()).toContain('new-company.pdf'))
    pending.resolve(respond({ job: summary(), files: [invoiceSet(17, 'old-company.pdf')] }))
    await flushPromises()
    expect(wrapper!.text()).not.toContain('old-company.pdf')
    expect(wrapper!.find('[role="dialog"]').exists()).toBe(false)
    await button('Process').trigger('click')
    expect(wrapper!.get('[role="dialog"]').text()).toContain('new-company.pdf')
  })

  it('does not replay an ambiguous finalize after the company changes', async () => {
    const pending = deferredResponse()
    requestOverrides.set('POST /companies/42/docai/jobs/70/finalize', () => pending.promise)
    staged = [invoiceSet(17, 'old-company.pdf')]
    await mountWorkspace()
    await button('Process').trigger('click')
    await button(/^Confirm /).trigger('click')
    await vi.waitFor(() => expect(finalizations()).toHaveLength(1))

    staged = [invoiceSet(18, 'new-company.pdf')]
    testState.profile.companyId = 43
    await vi.waitFor(() => expect(wrapper!.text()).toContain('new-company.pdf'))
    pending.reject(new Error('Connection closed after finalizing'))
    await flushPromises()

    expect(finalizations()).toHaveLength(1)
    expect(wrapper!.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper!.get('button[aria-label="Remove invoice set"]').attributes('disabled')).toBeUndefined()
    await button('Process').trigger('click')
    expect(wrapper!.get('[role="dialog"]').text()).toContain('new-company.pdf')
  })

  it('refreshes the company balance before a document switch discards the in-flight result', async () => {
    const pending = deferredResponse()
    requestOverrides.set('GET /companies/42/docai/70/result', () => pending.promise)
    staged = [invoiceSet(17, 'old-invoice.pdf')]
    await mountWorkspace()
    await button('Process').trigger('click')
    testState.profile.refreshBalance.mockClear()
    await button(/^Confirm /).trigger('click')
    await vi.waitFor(() => expect(testState.api).toHaveBeenCalledWith('/companies/42/docai/70/result', { method: 'GET' }))
    expect(testState.profile.refreshBalance).toHaveBeenCalledOnce()

    staged = []
    testState.route.query.type = 'TECHPACK'
    await vi.waitFor(() => expect(wrapper!.find('input[type="file"][multiple]').exists()).toBe(true))
    pending.resolve(respond({
      ...summary(),
      docType: 'INVOICE',
      status: 'COMPLETED',
      files: [invoiceSet(17, 'old-invoice.pdf')],
      processedBy: 'fixture@example.test',
      filesDeleted: false,
    }))
    await flushPromises()
    expect(testState.profile.refreshBalance).toHaveBeenCalledOnce()
    expect(wrapper!.text()).not.toContain('old-invoice.pdf')
    expect(wrapper!.find('input[type="file"][multiple]').exists()).toBe(true)
  })

  it.each([42, 99])('handles a late terminal status after switching workspaces to company %i', async (company) => {
    const pending = deferredResponse()
    requestOverrides.set('GET /companies/42/docai/70/status', () => pending.promise)
    staged = [invoiceSet(17, 'old-invoice.pdf')]
    await mountWorkspace()
    await button('Process').trigger('click')
    testState.profile.refreshBalance.mockClear()
    await button(/^Confirm /).trigger('click')
    await vi.waitFor(() => expect(testState.api).toHaveBeenCalledWith('/companies/42/docai/70/status', { method: 'GET' }))

    staged = []
    testState.profile.companyId = company
    testState.route.query.type = 'TECHPACK'
    await flushPromises()
    pending.resolve(respond({ jobId: 70, status: 'COMPLETED', progress: 100 }))
    await flushPromises()

    expect(testState.profile.refreshBalance).toHaveBeenCalledTimes(company === 42 ? 1 : 0)
    expect(testState.api).not.toHaveBeenCalledWith('/companies/42/docai/70/result', expect.anything())
  })

  it('still stages TechPack PDFs through the existing multi-file uploader', async () => {
    testState.route.query.type = 'TECHPACK'
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-upload')
    await mountWorkspace()
    expect(wrapper!.text()).not.toContain('Combined PDF')
    const field = wrapper!.get<HTMLInputElement>('input[type="file"][multiple]')
    Object.defineProperty(field.element, 'files', {
      configurable: true,
      value: [new File(['fixture'], 'one.pdf'), new File(['fixture'], 'two.pdf')],
    })
    await field.trigger('change')
    await vi.waitFor(() => expect(fileUploads()).toHaveLength(1))
    expect(fileUploads()[0]![1].query).toEqual({ type: 'TECHPACK' })
    expect(fileUploads()[0]![1].body.getAll('files').map((file: File) => file.name)).toEqual(['one.pdf', 'two.pdf'])
    expect(fileUploads()[0]![1].body.has('uploadRequestId')).toBe(false)
    expect(wrapper!.text()).toContain('Upload another file')
    await button('Process').trigger('click')
    await button(/^Confirm /).trigger('click')
    expect(finalizations()[0]![1]).toEqual({ method: 'POST' })
  })

  it('shows the TechPack result while refreshing the balance', async () => {
    const balance = deferredResponse()
    testState.profile.refreshBalance.mockReturnValueOnce(balance.promise)
    testState.route.query.type = 'TECHPACK'
    staged = [{ ...invoiceSet(17, 'tech-pack.pdf'), docType: 'TECHPACK' }]
    await mountWorkspace()
    await button('Process').trigger('click')
    await button(/^Confirm /).trigger('click')

    try {
      await vi.waitFor(() => expect(wrapper!.text()).toContain('Download Spreadsheet'))
    }
    finally {
      balance.resolve(undefined)
    }
  })

  it.each([false, true])('polls pending TechPack verification in the original workspace (switch=%s)', async (switchWorkspace) => {
    testState.route.query.type = 'TECHPACK'
    const file = { ...invoiceSet(17, 'original-techpack.pdf'), docType: 'TECHPACK' }
    staged = [file]
    const pending = deferredResponse()
    const response = (verificationPending: boolean) => respond({
      ...summary(), docType: 'TECHPACK', status: 'COMPLETED', filesDeleted: false,
      files: [{ ...file, verificationPending, excelDownloadUrl: verificationPending ? null : '/excel/17/download' }],
    })
    const getResult = vi.fn().mockImplementationOnce(() => response(true)).mockReturnValue(pending.promise)
    requestOverrides.set('GET /companies/42/docai/70/result', getResult)

    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    try {
      await mountWorkspace()
      await button('Process').trigger('click')
      await button(/^Confirm /).trigger('click')
      await flushPromises()
      expect(wrapper!.text()).toContain('Verifying your document')
      expect(wrapper!.text()).not.toContain('Download Spreadsheet')
      expect(testState.profile.refreshBalance).toHaveBeenCalledOnce()

      await vi.advanceTimersByTimeAsync(10_000)
      expect(getResult).toHaveBeenCalledTimes(2)
      if (switchWorkspace) {
        staged = []
        testState.route.query.type = 'INVOICE'
        await flushPromises()
      }
      pending.resolve(response(false))
      await flushPromises()
      expect(wrapper!.text()).not.toContain('Verifying your document')
      if (switchWorkspace) {
        expect(wrapper!.find('#invoice-upload-pdf').exists()).toBe(true)
        expect(wrapper!.text()).not.toContain('original-techpack.pdf')
      }
      else {
        expect(wrapper!.text()).toContain('Download Spreadsheet')
      }
      await vi.advanceTimersByTimeAsync(5000)
      expect(getResult).toHaveBeenCalledTimes(2)
      expect(testState.profile.refreshBalance).toHaveBeenCalledOnce()
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('uses the refreshed balance when the next invoice is started before the refresh finishes', async () => {
    const balance = deferredResponse()
    testState.profile.refreshBalance.mockResolvedValueOnce(undefined).mockImplementationOnce(async () => {
      await balance.promise
      testState.profile.tokenBalance = { balance: 0 }
    })
    staged = [invoiceSet(17, 'first.pdf')]
    await mountWorkspace()
    await button('Process').trigger('click')
    await button(/^Confirm /).trigger('click')
    await vi.waitFor(() => expect(button('Process another invoice set').exists()).toBe(true))
    await button('Process another invoice set').trigger('click')
    await vi.waitFor(() => expect(wrapper!.find('#invoice-upload-pdf').exists()).toBe(true))

    balance.resolve(undefined)
    await selectFile('.pdf', 'next.pdf')
    await button('Process').trigger('click')
    await vi.waitFor(() => expect(wrapper!.get('[role="dialog"]').text()).toContain('Insufficient tokens.'))
    expect(finalizations()).toHaveLength(1)
  })

  it('enables a replacement invoice when its refund settles during review', async () => {
    let walletBalance = 10
    testState.profile.refreshBalance.mockImplementation(async () => {
      testState.profile.tokenBalance = { balance: walletBalance }
    })
    status = 'FAILED'
    fileError = 'The packing list references a different invoice.'
    await mountWorkspace()
    await selectFile('.pdf', 'first.pdf')
    await button('Process').trigger('click')
    await vi.waitFor(() => expect(button(/^Confirm /).exists()).toBe(true))
    walletBalance = 0
    await button(/^Confirm /).trigger('click')
    await vi.waitFor(() => expect(button('Replace files and try again').exists()).toBe(true))
    await button('Replace files and try again').trigger('click')
    await vi.waitFor(() => expect(wrapper!.find('#invoice-upload-pdf').exists()).toBe(true))
    await selectFile('.pdf', 'replacement.pdf')

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      await button('Process').trigger('click')
      await flushPromises()
      expect(wrapper!.get('[role="dialog"]').text()).toContain('Insufficient tokens.')
      walletBalance = 10
      await vi.advanceTimersByTimeAsync(10_000)
      await flushPromises()
      expect(button(/^Confirm /).exists()).toBe(true)
      await button('Cancel').trigger('click')
      const callsAfterClose = testState.profile.refreshBalance.mock.calls.length
      await vi.advanceTimersByTimeAsync(10_000)
      expect(testState.profile.refreshBalance).toHaveBeenCalledTimes(callsAfterClose)
    }
    finally {
      vi.useRealTimers()
    }
    expect(finalizations()).toHaveLength(1)
  })
})
