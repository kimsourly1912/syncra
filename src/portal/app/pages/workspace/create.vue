<script lang="ts">
import type { NuxtUIColor } from '~/types/nuxt-ui'
import type { BaseDTO, DocAIDTO } from '@/types/dto'
import type { StepperItem } from '@nuxt/ui'
// import type { IContactSaleForTokenSchema } from '@/schema/contact-sale-token'
</script>

<script setup lang="ts">
import { UBadge, UButton } from '#components'
import * as docaiService from '@/services/docai.service'
import { useDropZone, useFileDialog } from '@vueuse/core'
// import * as contactSaleService from '@/services/contact-sale.service'
import UploadedFileInfo from '~/features/workspace/components/UploadedFileInfo.vue'
import ExtractionFileInfo from '~/features/workspace/components/ExtractionFileInfo.vue'
import { humanFileSize, capitalizeFirst, humanFormatSeconds } from '@/utils/common'
import ExtractionFileProcessing from '~/features/workspace/components/ExtractionFileProcessing.vue'

type Status = DocAIDTO.DocAIJobStatus
type InvoiceMode = 'combined' | 'separate'
type InvoiceFileRole = 'pdf' | 'packing' | 'rolls'

interface StatusItem {
  icon: string
  label: string
  status: Status
  color: NuxtUIColor
  processTag: string
  completedTag: string
}

interface OpenItem {
  process: boolean
  submit: boolean
}

interface LoadingItem {
  createJob: boolean
  upload: boolean
  finalize: boolean
  result: boolean
  requestToken: boolean
}

interface WorkspaceContext extends DocAIDTO.DocAIParam {
  revision: number
  docType: DocAIDTO.DocType
}

interface JobContext extends WorkspaceContext, DocAIDTO.JobParam {}

interface LocalInvoiceUpload {
  jobId: number
  requestId: string
  fileId?: number
}

const route = useRoute()
const { toast } = useAppToast()
const profileStore = useProfileStore()
const reqToken = useRequestToken()

const open = reactive<OpenItem>({
  process: false,
  submit: false,
})

const MAX_FILE_SIZE = 50
const fileInfo = {
  size: MAX_FILE_SIZE,
  accept: ['.pdf'],
  maxSize: MAX_FILE_SIZE * 1024 * 1024, // 50MB
}
const INVOICE_FILE_SIZE_MB = 25
// Leave space for the multipart boundaries and file headers in the 50 MiB request limit.
const INVOICE_SET_SIZE_MB = 49
const MEBIBYTE = 1024 * 1024
const invoiceFields = {
  combined: [{ role: 'pdf', part: 'mainFile', label: 'Combined invoice, packing list, and fabric rolls PDF', extensions: ['.pdf'] }],
  separate: [
    { role: 'pdf', part: 'mainFile', label: 'Invoice PDF', extensions: ['.pdf'] },
    { role: 'packing', part: 'packing_list', label: 'Packing list PDF or XLSX', extensions: ['.pdf', '.xlsx'] },
    { role: 'rolls', part: 'fabric_rolls', label: 'Fabric rolls PDF (optional)', extensions: ['.pdf'] },
  ],
} as const

const dropZoneRef = ref<HTMLElement>()
const loadingFileIds = ref(new Set<number>())
const fileQueue = ref<File[]>([])
const pendingFiles = ref<File[]>([])
const stagedFiles = ref<DocAIDTO.JobFile[]>([])
const docType = computed(() => normalizeDocType(route.query.type))
const invoiceMode = shallowRef<InvoiceMode>('combined')
const invoiceFiles = shallowReactive<Partial<Record<InvoiceFileRole, File>>>({})
const invoiceFileErrors = reactive<Partial<Record<InvoiceFileRole, string>>>({})
const localInvoiceUpload = shallowRef<LocalInvoiceUpload | null>(null)
const invoiceReview = shallowRef<{ context: JobContext, file: DocAIDTO.JobFile } | null>(null)
const invoiceDraftNeedsReload = shallowRef(false)
const invoiceFinalizeUnconfirmed = shallowRef(false)
const job = shallowRef<DocAIDTO.JobSummary | null>(null)
const status = shallowRef<DocAIDTO.JobStatusData | null>(null)
const result = shallowRef<DocAIDTO.JobResultData | null>(null)
const verificationPending = computed(() => result.value?.files.some(file => file.verificationPending) ?? false)
const pollingTimer = shallowRef<NodeJS.Timeout | null>(null)
const step = shallowRef<'upload' | 'process' | 'completed'>('upload')
let workspaceRevision = 0
let fileDialogRevision = -1

// const cotnactSaleData = reactive<IContactSaleForTokenSchema>({
//   amount: '',
//   message: '',
// })

const loading = reactive<LoadingItem>({
  createJob: false,
  upload: false,
  finalize: false,
  result: false,
  requestToken: false,
})

/**
* Intentionally leave some field blank
*/
const statusMap = {
  COMPLETED: {
    color: 'success',
    icon: 'lucide:circle-check',
    label: 'Extraction Completed!',
    status: 'COMPLETED',
    processTag: 'Done',
    completedTag: 'Ready',
  },
  PARTIAL_COMPLETED: {
    color: 'warning',
    icon: 'lucide:info',
    label: 'Extraction Partially Completed!',
    status: 'PARTIAL_COMPLETED',
    processTag: 'Partial',
    completedTag: 'Partial',
  },
  REJECTED: {
    color: 'error',
    icon: 'lucide:triangle-alert',
    label: 'Extraction Rejected!',
    status: 'REJECTED',
    processTag: '',
    completedTag: 'Rejected',
  },
  FAILED: {
    color: 'error',
    icon: 'lucide:x',
    label: 'Extraction Failed!',
    status: 'FAILED',
    processTag: '',
    completedTag: 'Failed',
  },
  DRAFT: {
    icon: '',
    label: '',
    color: 'neutral',
    status: 'DRAFT',
    processTag: '',
    completedTag: '',
  },
  PENDING: {
    icon: '',
    label: '',
    color: 'neutral',
    status: 'PENDING',
    processTag: 'Queued',
    completedTag: '',
  },
  PROCESSING: {
    icon: '',
    label: '',
    color: 'neutral',
    status: 'PROCESSING',
    processTag: 'In Progress',
    completedTag: '',
  },
} satisfies Record<Status, StatusItem>

const docTypeLabel = computed(() => capitalizeFirst(docType.value.replace('_', ' ')))
const isInvoice = computed(() => docType.value === 'INVOICE')
const invoiceSelectionHint = computed(() => {
  if (stagedFiles.value.length > 1)
    return 'Remove the extra files to leave one invoice set.'
  if (stagedFiles.value[0]?.status === 'FAILED')
    return 'Retry removing the invoice set before processing.'
  if (stagedFiles.value.length === 1)
    return ''
  if (invoiceMode.value === 'combined')
    return invoiceFiles.pdf ? '' : 'Choose a combined PDF.'
  if (!invoiceFiles.pdf && !invoiceFiles.packing)
    return 'Choose an invoice PDF and a packing list PDF or XLSX.'
  if (!invoiceFiles.pdf)
    return 'Choose an invoice PDF.'
  if (!invoiceFiles.packing)
    return 'Choose a packing list PDF or XLSX.'
  if (invoiceFileErrors.rolls)
    return 'Replace or remove the fabric rolls file.'
  if (invoiceFiles.pdf.size + invoiceFiles.packing.size + (invoiceFiles.rolls?.size ?? 0) > INVOICE_SET_SIZE_MB * MEBIBYTE)
    return `Choose files totaling up to ${INVOICE_SET_SIZE_MB} MB.`
  return ''
})
const draftBusy = computed(() => loading.createJob || loading.upload || loading.finalize || loadingFileIds.value.size > 0)
const reviewFiles = computed(() => invoiceReview.value ? [invoiceReview.value.file] : stagedFiles.value)
const companyId = computed(() => profileStore.companyId)
const currentStatus = computed<DocAIDTO.DocAIJobStatus>(() => result.value?.status ?? status.value?.status ?? job.value?.status ?? 'DRAFT')
const statusValue = computed(() => statusMap[currentStatus.value as keyof typeof statusMap])
const summaryJob = computed(() => result.value ?? job.value)
const fileCount = computed(() => summaryJob.value?.fileCount ?? result.value?.files?.length ?? stagedFiles.value.length)
const totalRequiredCredits = computed(() => summaryJob.value?.totalRequiredCredits ?? result.value?.totalCreditsCharged ?? 0)
const totalEstimatedSeconds = computed(() => summaryJob.value?.totalEstimatedSeconds ?? 0)
// const totalSizeBytes = computed(() => summaryJob.value?.totalSizeBytes ?? stagedFiles.value.reduce((acc, file) => acc + (file.sizeBytes || 0), 0))
const formattedEta = computed(() => formatSeconds(totalEstimatedSeconds.value))
const formattedCredits = computed(() => formatNumber(totalRequiredCredits.value))
const uploadDescription = computed(() => {
  if (!fileCount.value)
    return ''
  return isInvoice.value ? '1 invoice set' : `${fileCount.value} file(s)`
})
const insufficientToken = computed(() => {
  if (invoiceFinalizeUnconfirmed.value) return false
  if (!profileStore.tokenBalance) return true
  const credit = totalRequiredCredits.value
  const balance = profileStore.tokenBalance.balance
  return !(balance >= credit)
})

const stepItems = computed(() => {
  return [
    {
      title: 'Upload',
      icon: 'lucide:upload',
      description: uploadDescription.value,
      slot: 'upload' as const,
      value: 'upload' as const,
    },
    {
      title: 'Process',
      icon: 'lucide:loader',
      description: statusValue.value.processTag,
      slot: 'process' as const,
      value: 'process' as const,
    },
    {
      title: 'Completed',
      icon: 'lucide:circle-check',
      description: statusValue.value.completedTag,
      slot: 'completed' as const,
      value: 'completed' as const,
    },
  ] satisfies StepperItem[]
})

const formattedId = ref<string | null | undefined>(null)
const invoiceFileError = computed(() => result.value?.files.find(file => file.errorMessage)?.errorMessage)
const processingError = computed(() =>
  (isInvoice.value && invoiceFileError.value)
  || status.value?.errorMessage || result.value?.errorMessage || job.value?.errorMessage || null,
)
const invoiceFailed = computed(() =>
  isInvoice.value && (currentStatus.value === 'FAILED' || currentStatus.value === 'REJECTED'),
)
const progressValue = computed(() => status.value?.progress ?? job.value?.progress ?? null)

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: (files: File[] | null) => {
    // Prevent duplicate uploads when UFileUpload is visible and handling the drop
    if (isInvoice.value || step.value !== 'upload' || draftBusy.value || !stagedFiles.value.length)
      return

    if (files && files.length > 0) {
      const currentFiles = fileQueue.value || []
      fileQueue.value = [...currentFiles, ...files]
    }
  },
})

const processProps = {
  async onOpen() {
    const workspace = getWorkspaceContext()
    if (!workspace || draftBusy.value || step.value !== 'upload')
      return
    if (isInvoice.value) {
      if (invoiceDraftNeedsReload.value || invoiceSelectionHint.value)
        return
      if (!stagedFiles.value.length) {
        const body = new FormData()
        body.set('mode', invoiceMode.value)
        for (const { role, part } of invoiceFields[invoiceMode.value]) {
          const file = invoiceFiles[role]
          if (file)
            body.set(part, file)
        }
        if (!await uploadFiles(body, workspace) || !isCurrentWorkspace(workspace))
          return
      }
      const context = getJobContext(workspace)
      const [file] = stagedFiles.value
      if (!context || !file || invoiceSelectionHint.value)
        return
      invoiceReview.value = { context, file: { ...file } }
    }
    if (stagedFiles.value.length) {
      open.process = true
    }
    else {
      toast.add('warning', { title: 'Upload required', description: 'Please upload at least one file before processing.' })
    }
  },
  onConfirm() {
    finalizeCurrentJob()
  },
}

function clearInvoiceFiles() {
  for (const { role } of invoiceFields.separate)
    clearInvoiceFile(role)
}

function clearInvoiceFile(role: InvoiceFileRole) {
  localInvoiceUpload.value = null
  invoiceFiles[role] = undefined
  invoiceFileErrors[role] = undefined
}

function selectInvoiceFile(event: Event, role: InvoiceFileRole, extensions: readonly string[]) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  setInvoiceFile(role, extensions, files)
}

function setInvoiceFile(role: InvoiceFileRole, extensions: readonly string[], files: ArrayLike<File>) {
  const file = files[0]
  if (!file || !isInvoice.value || draftBusy.value || step.value !== 'upload')
    return

  clearInvoiceFile(role)

  if (files.length > 1)
    invoiceFileErrors[role] = 'Choose one file for this field.'
  else if (!extensions.some(extension => file.name.toLowerCase().endsWith(extension)))
    invoiceFileErrors[role] = `Choose a file with extension ${extensions.join(' or ')}.`
  else if (file.size === 0)
    invoiceFileErrors[role] = 'Choose a file that is not empty.'
  else if (file.size > INVOICE_FILE_SIZE_MB * MEBIBYTE)
    invoiceFileErrors[role] = `Choose a file up to ${INVOICE_FILE_SIZE_MB} MB.`
  else
    invoiceFiles[role] = file
}

function normalizeDocType(type: unknown): DocAIDTO.DocType {
  const value = String(type ?? '').toUpperCase()
  const allowed: DocAIDTO.DocType[] = ['TECHPACK', 'PURCHASE_ORDER', 'INVOICE']
  return allowed.includes(value as DocAIDTO.DocType) ? value as DocAIDTO.DocType : 'TECHPACK'
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value ?? 0)
}

function formatSeconds(seconds: number) {
  if (!seconds || seconds < 0)
    return 'Calculating...'
  return humanFormatSeconds(seconds, false)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object'
}

function ensureData<T>(res: unknown, fallback: string, options: { allowNullData?: boolean } = {}): T | null {
  const { allowNullData = false } = options
  const record = isRecord(res) ? res : null
  const successValue = record?.['success']
  const success = typeof successValue === 'boolean' ? successValue : true
  if (!success) {
    const reason = record?.['reason']
    toast.add('error', { title: 'Doc AI', description: typeof reason === 'string' ? reason : fallback })
    return null
  }
  const data = record?.['data'] ?? res
  if (!data && !allowNullData) {
    toast.add('error', { title: 'Doc AI', description: fallback })
    return null
  }
  return (data ?? null) as T
}

function isJobFile(file: DocAIDTO.JobFile | File): file is DocAIDTO.JobFile {
  return typeof (file as DocAIDTO.JobFile).fileId === 'number'
}

const { open: openFileDialog, onChange: onFileDialogChange } = useFileDialog({
  accept: 'image/jpeg, image/png, application/pdf',
  multiple: true,
})

function openUploadDialog() {
  fileDialogRevision = workspaceRevision
  openFileDialog()
}

onFileDialogChange((files) => {
  if (fileDialogRevision === workspaceRevision && files?.length && !isInvoice.value && step.value === 'upload' && !draftBusy.value) {
    const currentFiles = fileQueue.value || []
    fileQueue.value = [...currentFiles, ...Array.from(files)]
  }
})

function getWorkspaceContext(): WorkspaceContext | null {
  const id = companyId.value
  return id && id > 0 ? { companyId: id, docType: docType.value, revision: workspaceRevision } : null
}

function getJobContext(workspace = getWorkspaceContext()): JobContext | null {
  const id = job.value?.jobId
  return workspace && id ? { ...workspace, jobId: id } : null
}

function isCurrentWorkspace(context: WorkspaceContext) {
  return context.revision === workspaceRevision && context.companyId === companyId.value && context.docType === docType.value
}

function isCurrentJob(context: JobContext) {
  return isCurrentWorkspace(context) && context.jobId === job.value?.jobId
}

function setDraft(summary: DocAIDTO.JobSummary | null, files: DocAIDTO.JobFile[] = []) {
  job.value = summary
  formattedId.value = summary?.formattedId
  stagedFiles.value = files
}

function closeProcess() {
  open.process = false
  invoiceReview.value = null
}

async function loadDraftFiles(workspace: WorkspaceContext, draft: DocAIDTO.JobSummary) {
  if (!draft.jobId) {
    setDraft(draft)
    return true
  }

  const res = await docaiService.listFiles({ companyId: workspace.companyId, jobId: draft.jobId })
  if (!isCurrentWorkspace(workspace))
    return false
  const data = ensureData<DocAIDTO.StagedJobData>(res, 'Unable to load existing files.')
  if (!data)
    return false
  const summary = data.job ?? draft
  if (workspace.docType === 'INVOICE' && summary.status !== 'DRAFT')
    setDraft(null)
  else
    setDraft(summary, data.files ?? [])
  return true
}

async function initJob(workspace = getWorkspaceContext()) {
  if (!workspace || !isCurrentWorkspace(workspace) || loading.createJob)
    return

  loading.createJob = true
  try {
    const res = await docaiService.createJob(workspace, { type: workspace.docType })
    if (!isCurrentWorkspace(workspace))
      return
    const data = ensureData<DocAIDTO.CreateJobData>(res, 'Unable to start Doc AI job.')
    if (!data)
      return
    // The singleton draft may already contain files from an earlier session.
    if (workspace.docType === 'INVOICE') {
      invoiceDraftNeedsReload.value = true
      if (await loadDraftFiles(workspace, data) && isCurrentWorkspace(workspace))
        invoiceDraftNeedsReload.value = false
    }
    else {
      setDraft(data)
      await loadDraftFiles(workspace, data)
    }
  }
  catch (e) {
    if (isCurrentWorkspace(workspace))
      toast.addException(e)
  }
  finally {
    if (isCurrentWorkspace(workspace))
      loading.createJob = false
  }
}

async function reloadInvoiceDraft(workspace = getWorkspaceContext()) {
  if (!workspace || !isCurrentWorkspace(workspace) || loading.createJob)
    return

  loading.createJob = true
  invoiceDraftNeedsReload.value = true
  closeProcess()
  try {
    const res = await docaiService.getCurrentDraft(workspace, { type: workspace.docType })
    if (!isCurrentWorkspace(workspace))
      return
    if (!res.success) {
      ensureData(res, 'Unable to reload the invoice draft.')
      return
    }
    if (res.data) {
      if (!await loadDraftFiles(workspace, res.data) || !isCurrentWorkspace(workspace))
        return
    }
    else {
      setDraft(null)
    }

    const upload = localInvoiceUpload.value
    const [file] = stagedFiles.value
    if (upload && job.value?.jobId === upload.jobId && file && stagedFiles.value.length === 1
      && (file.fileId === upload.fileId || file.uploadRequestId === upload.requestId)) {
      localInvoiceUpload.value = { ...upload, fileId: file.fileId }
    }
    else if (upload?.fileId !== undefined || stagedFiles.value.length) {
      clearInvoiceFiles()
    }
    invoiceDraftNeedsReload.value = false
  }
  catch (e) {
    if (isCurrentWorkspace(workspace))
      toast.addException(e)
  }
  finally {
    if (isCurrentWorkspace(workspace))
      loading.createJob = false
  }
}

async function uploadFiles(files: File[] | FormData, workspace = getWorkspaceContext()) {
  if (!workspace || !isCurrentWorkspace(workspace) || draftBusy.value)
    return false

  const invoice = workspace.docType === 'INVOICE'
  loading.upload = true
  pendingFiles.value = files instanceof FormData
    ? Array.from(files.values()).filter((part): part is File => typeof part !== 'string')
    : files
  try {
    if (!job.value?.jobId) {
      await initJob(workspace)
      if (!isCurrentWorkspace(workspace))
        return false
      if (invoice && (invoiceDraftNeedsReload.value || stagedFiles.value.length))
        return false
    }
    const context = getJobContext(workspace)
    if (!context) {
      toast.add('error', { title: 'Doc AI', description: 'Failed to initialize job. Please try again.' })
      return false
    }

    let upload = invoice ? localInvoiceUpload.value : null
    if (invoice && upload?.jobId !== context.jobId) {
      upload = { jobId: context.jobId, requestId: crypto.randomUUID() }
      localInvoiceUpload.value = upload
    }
    const res = await docaiService.addFiles(context, context.docType, files, upload?.requestId)
    if (!isCurrentJob(context))
      return false
    const data = ensureData<DocAIDTO.StagedJobData>(res, 'Failed to upload files.')
    if (!data || (invoice && (data.job.status !== 'DRAFT' || data.files.length !== 1))) {
      if (invoice)
        await reloadInvoiceDraft(workspace)
      return false
    }

    setDraft(data.job, data.files)
    if (upload)
      localInvoiceUpload.value = { ...upload, fileId: data.files[0]!.fileId }
    toast.add('success', {
      title: invoice ? 'Invoice set uploaded' : 'Files uploaded',
      description: invoice ? undefined : `${pendingFiles.value.length} file(s) staged.`,
    })
    return true
  }
  catch (e) {
    if (!isCurrentWorkspace(workspace))
      return false
    const err = e as BaseDTO.OFetchError
    const statusCode = err.statusCode ?? err.response?.status
    if (statusCode === 413) {
      toast.add('error', {
        title: 'Upload too large',
        description: 'Request payload is too large. Please upload smaller file(s) or fewer files.',
      })
    }
    else {
      toast.addException(e)
    }
    if (invoice)
      await reloadInvoiceDraft(workspace)
    return false
  }
  finally {
    if (isCurrentWorkspace(workspace)) {
      loading.upload = false
      pendingFiles.value = []
    }
  }
}

async function handleDeleteFile(file: DocAIDTO.JobFile | File, idx: number) {
  if (draftBusy.value || step.value !== 'upload' || invoiceDraftNeedsReload.value || invoiceFinalizeUnconfirmed.value)
    return
  const context = getJobContext()
  if (!context || !isJobFile(file)) {
    stagedFiles.value.splice(idx, 1)
    return
  }

  const invoice = context.docType === 'INVOICE'
  loadingFileIds.value.add(file.fileId)
  try {
    const res = await docaiService.removeFile({ ...context, fileId: file.fileId }, invoice ? { draftOnly: true } : undefined)
    if (!isCurrentJob(context))
      return
    const data = ensureData<DocAIDTO.StagedJobData>(res, 'Failed to remove file.')
    if (!data || (invoice && data.job.status !== 'DRAFT')) {
      if (invoice)
        await reloadInvoiceDraft(context)
      return
    }

    setDraft(data.job, data.files)
    if (invoice) {
      invoiceMode.value = 'combined'
      clearInvoiceFiles()
    }
  }
  catch (e) {
    if (!isCurrentJob(context))
      return
    toast.addException(e)
    if (invoice)
      await reloadInvoiceDraft(context)
  }
  finally {
    if (isCurrentWorkspace(context))
      loadingFileIds.value.delete(file.fileId)
  }
}

function finalizeErrorStatus(error: unknown) {
  const err = error as BaseDTO.OFetchError | null | undefined
  return err?.statusCode ?? err?.response?.status
}

function isAmbiguousFinalizeError(error: unknown) {
  const code = finalizeErrorStatus(error)
  return code == null || code === 408 || code >= 500
}

async function requestFinalization(context: JobContext, expectedFileId?: number) {
  const query = expectedFileId === undefined ? undefined : { expectedFileId }
  try {
    return await docaiService.finalizeJob(context, query)
  }
  catch (e) {
    if (!query || !isCurrentJob(context) || !isAmbiguousFinalizeError(e))
      throw e
    // Finalization is idempotent for this job and reviewed file ID.
    invoiceFinalizeUnconfirmed.value = true
    return docaiService.finalizeJob(context, query)
  }
}

async function finalizeCurrentJob() {
  if (!open.process || step.value !== 'upload' || draftBusy.value || invoiceDraftNeedsReload.value)
    return

  const review = invoiceReview.value
  const context = isInvoice.value ? review?.context : getJobContext()
  if (!context || !isCurrentJob(context)) {
    toast.add('error', { title: 'Doc AI', description: 'Job not found. Please try again.' })
    return
  }
  if (!stagedFiles.value.length) {
    toast.add('warning', { title: 'Upload required', description: 'Please upload at least one file before processing.' })
    return
  }

  loading.finalize = true
  try {
    const res = await requestFinalization(context, review?.file.fileId)
    if (!isCurrentJob(context))
      return
    ensureData(res, 'Failed to finalize job.', { allowNullData: true })
    if (res?.success === false) {
      if (review && !invoiceFinalizeUnconfirmed.value)
        await reloadInvoiceDraft(context)
      return
    }
    invoiceFinalizeUnconfirmed.value = false
    closeProcess()
    step.value = 'process'
    void pollStatus(context)
  }
  catch (e) {
    if (!isCurrentJob(context))
      return
    if (review && (isAmbiguousFinalizeError(e)
      || (invoiceFinalizeUnconfirmed.value && finalizeErrorStatus(e) !== 409))) {
      invoiceFinalizeUnconfirmed.value = true
      return
    }
    invoiceFinalizeUnconfirmed.value = false
    toast.addException(e)
    if (review)
      await reloadInvoiceDraft(context)
  }
  finally {
    if (isCurrentWorkspace(context))
      loading.finalize = false
  }
}

async function pollStatus(context: JobContext) {
  if (!isCurrentJob(context))
    return

  let finished = false
  try {
    const res = await docaiService.getJobStatus(context)
    finished = res.success && ['COMPLETED', 'PARTIAL_COMPLETED', 'FAILED', 'REJECTED'].includes(res.data?.status)
    if (finished && context.companyId === companyId.value)
      void profileStore.refreshBalance()
    if (!isCurrentJob(context))
      return
    const data = ensureData<DocAIDTO.JobStatusData>(res, 'Failed to retrieve job status.')
    if (!data)
      return
    status.value = data
    formattedId.value = data.formattedId
    if (finished) {
      if (data.status === 'COMPLETED' || data.status === 'PARTIAL_COMPLETED')
        clearInvoiceFiles()
      await fetchResult(context)
      if (isCurrentJob(context))
        step.value = 'completed'
    }
  }
  catch (e) {
    if (isCurrentJob(context))
      toast.addException(e)
  }
  finally {
    if (!finished && isCurrentJob(context))
      pollingTimer.value = setTimeout(() => void pollStatus(context), 3000)
  }
}

async function fetchResult(context: JobContext, background = false) {
  if (!isCurrentJob(context) || loading.result)
    return

  loading.result = true
  try {
    const res = await docaiService.getJobResult(context)
    if (!isCurrentJob(context) || (background && !res.success))
      return
    const data = ensureData<DocAIDTO.JobResultData>(res, 'Failed to fetch job result.')
    if (!data)
      return
    result.value = data
    formattedId.value = data.formattedId
  }
  catch (e) {
    if (!background && isCurrentJob(context))
      toast.addException(e)
  }
  finally {
    if (isCurrentJob(context))
      loading.result = false
  }
}

watch(verificationPending, (pending, _, onCleanup) => {
  const context = getJobContext()
  if (!pending || !context) return
  const timer = setInterval(() => void fetchResult(context, true), 5000)
  onCleanup(() => clearInterval(timer))
})

function stopPolling() {
  if (pollingTimer.value) {
    clearTimeout(pollingTimer.value)
    pollingTimer.value = null
  }
}

function onProcessAnotherFile() {
  const failedSet = invoiceFailed.value ? stagedFiles.value[0] : undefined
  const retryMode = failedSet?.attachments?.some(file => file.role === 'packing_list') ? 'separate' : 'combined'
  const keepInvoiceFiles = failedSet != null && failedSet.fileId === localInvoiceUpload.value?.fileId
  resetState(retryMode, keepInvoiceFiles)
  void initJob()
}

function onOpenContactSale() {
  closeProcess()
  reqToken.setOpen('request', true)
  // open.contactSale = true
  // cotnactSaleData.amount = ''
  // cotnactSaleData.message = ''
}

function resetState(mode: InvoiceMode = 'combined', keepInvoiceFiles = false) {
  workspaceRevision++
  stopPolling()
  closeProcess()
  invoiceMode.value = mode
  if (!keepInvoiceFiles)
    clearInvoiceFiles()
  localInvoiceUpload.value = null
  invoiceDraftNeedsReload.value = false
  invoiceFinalizeUnconfirmed.value = false
  setDraft(null)
  fileQueue.value = []
  pendingFiles.value = []
  loadingFileIds.value.clear()
  loading.createJob = false
  loading.upload = false
  loading.finalize = false
  loading.result = false
  status.value = null
  result.value = null
  step.value = 'upload'
}

// async function onRequestToken(evt: FormSubmitEvent<IContactSaleForTokenSchema>) {
//   loading.requestToken = true
//   const { amount, message } = evt.data
//   try {
//     await contactSaleService.createRequestToken({
//       customerMessage: message,
//       tokenAmount: Number(amount),
//       emailAddress: profileStore.data?.email ?? '',
//       requestedByName: profileStore.data?.fullName ?? '',
//     })
//     open.contactSale = false
//     open.successContactSale = true
//   }
//   catch (e) {
//     toast.addException(e)
//   }
//   finally {
//     loading.requestToken = false
//   }
// }

watch(invoiceMode, clearInvoiceFiles, { flush: 'sync' })
watch(() => open.process, (isOpen, _, onCleanup) => {
  if (!isOpen) {
    invoiceReview.value = null
    return
  }
  if (!isInvoice.value) return
  let closed = false
  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => {
    closed = true
    clearTimeout(timer)
  })
  async function checkBalance() {
    await profileStore.refreshBalance()
    // A failed invoice's refund may settle while its replacement is under review.
    if (!closed)
      timer = setTimeout(checkBalance, 10_000)
  }
  void checkBalance()
}, { flush: 'sync' })

// watch(() => reqToken.status.value, (v) => {
//   if (v === 'success')
//     open.successContactSale = true
// })

watch(fileQueue, async (files) => {
  const workspace = getWorkspaceContext()
  if (!workspace || !files.length || isInvoice.value || step.value !== 'upload' || draftBusy.value)
    return
  const totalSizesFile = files.reduce((acc, item) => acc += item.size, 0)

  if (!(fileInfo.maxSize >= totalSizesFile)) {
    fileQueue.value = []
    toast.add('warning', { title: 'Failed', description: `Total upload size must be under ${fileInfo.size}MB.` })
    return
  }

  await uploadFiles(files, workspace)
  if (isCurrentWorkspace(workspace))
    fileQueue.value = []
}, { deep: false })

onMounted(() => {
  watch([companyId, docType], () => {
    resetState()
    void initJob()
  }, { immediate: true, flush: 'sync' })
})

onBeforeUnmount(() => {
  workspaceRevision++
  stopPolling()
})
</script>

<template>
  <UDashboardPanel id="create-workspace">
    <template #header>
      <LayoutHeader
        :to="toRoute('/workspace')"
        title="Back"
      />
    </template>

    <template #body>
      <LayoutContent>
        <UStepper
          v-model="step"
          :items="stepItems"
          disabled
          :ui="{
            root: tw`gap-12`,
            header: tw`bg-elevated/50 ring ring-default px-2 py-4 rounded-lg`,
          }"
        >
          <template #upload>
            <LayoutWrapper
              :title="`Upload ${docTypeLabel}`"
              :description="isInvoice ? 'Upload one invoice and packing list set per job.' : 'Drag and drop your file or click to browse from your computer'"
            >
              <div
                v-if="loading.createJob"
                class="space-y-4"
              >
                <USkeleton class="h-12 w-full" />
                <USkeleton class="h-12 w-full" />
                <USkeleton class="h-12 w-full" />
              </div>
              <div
                v-else-if="isInvoice && invoiceDraftNeedsReload"
                class="space-y-3"
              >
                <p
                  role="status"
                  class="text-sm text-muted"
                >
                  Reload the draft to check which files are staged.
                </p>
                <UButton
                  label="Reload invoice draft"
                  @click="reloadInvoiceDraft()"
                />
              </div>
              <div
                v-else-if="isInvoice"
                class="space-y-6"
              >
                <fieldset
                  v-if="!stagedFiles.length"
                  :disabled="draftBusy"
                  class="space-y-4"
                >
                  <legend class="font-semibold text-highlighted">
                    How are your files organized?
                  </legend>
                  <div class="grid gap-3 sm:grid-cols-2">
                    <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-default p-4 has-checked:border-primary has-checked:bg-primary/5">
                      <input
                        v-model="invoiceMode"
                        type="radio"
                        name="invoice-upload-mode"
                        value="combined"
                        class="mt-1 accent-primary"
                      >
                      <span class="space-y-1">
                        <span class="block font-medium text-highlighted">Combined PDF</span>
                        <span class="block text-sm text-muted">One PDF containing the invoice, packing list, and fabric rolls</span>
                      </span>
                    </label>
                    <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-default p-4 has-checked:border-primary has-checked:bg-primary/5">
                      <input
                        v-model="invoiceMode"
                        type="radio"
                        name="invoice-upload-mode"
                        value="separate"
                        class="mt-1 accent-primary"
                      >
                      <span class="space-y-1">
                        <span class="block font-medium text-highlighted">Separate files</span>
                        <span class="block text-sm text-muted">Invoice and packing list, with an optional fabric rolls PDF</span>
                      </span>
                    </label>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <div
                      v-for="field in invoiceFields[invoiceMode]"
                      :key="`${invoiceMode}-${field.role}`"
                      class="space-y-2 rounded-lg border border-default p-4"
                      :class="{ 'sm:col-span-2': invoiceMode === 'combined' }"
                      @dragover.prevent
                      @drop.stop.prevent="setInvoiceFile(field.role, field.extensions, $event.dataTransfer?.files ?? [])"
                    >
                      <p
                        :id="`invoice-upload-${field.role}-label`"
                        class="block text-sm font-medium text-highlighted"
                      >
                        {{ field.label }}
                      </p>
                      <div class="flex flex-wrap items-center gap-2">
                        <input
                          :id="`invoice-upload-${field.role}`"
                          type="file"
                          :accept="field.extensions.join(',')"
                          :aria-labelledby="`invoice-upload-${field.role}-label`"
                          :aria-invalid="Boolean(invoiceFileErrors[field.role])"
                          :aria-describedby="invoiceFileErrors[field.role] ? `invoice-upload-${field.role}-error` : invoiceFiles[field.role] ? `invoice-upload-${field.role}-selection` : undefined"
                          class="peer sr-only"
                          @change="selectInvoiceFile($event, field.role, field.extensions)"
                        >
                        <label
                          :for="`invoice-upload-${field.role}`"
                          class="cursor-pointer rounded-md bg-elevated px-3 py-2 text-sm font-medium text-highlighted hover:bg-accented peer-focus-visible:ring-2 peer-focus-visible:ring-primary"
                        >
                          {{ invoiceFiles[field.role] ? 'Replace file' : 'Choose file' }}
                        </label>
                        <span
                          v-if="invoiceFiles[field.role]"
                          :id="`invoice-upload-${field.role}-selection`"
                          class="break-all text-sm text-muted"
                        >
                          {{ invoiceFiles[field.role]?.name }}
                        </span>
                        <UButton
                          v-if="field.role === 'rolls' && (invoiceFiles.rolls || invoiceFileErrors.rolls)"
                          label="Remove"
                          aria-label="Remove fabric rolls file"
                          variant="ghost"
                          color="neutral"
                          @click="clearInvoiceFile('rolls')"
                        />
                      </div>
                      <p
                        v-if="invoiceFileErrors[field.role]"
                        :id="`invoice-upload-${field.role}-error`"
                        role="alert"
                        class="text-sm text-error"
                      >
                        {{ invoiceFileErrors[field.role] }}
                      </p>
                    </div>
                  </div>
                  <p class="text-sm text-muted">
                    Up to {{ INVOICE_FILE_SIZE_MB }} MB per file.
                    <template v-if="invoiceMode === 'separate'">
                      Up to {{ INVOICE_SET_SIZE_MB }} MB total.
                    </template>
                  </p>
                </fieldset>

                <ul
                  v-else
                  class="space-y-4"
                >
                  <UploadedFileInfo
                    :files="stagedFiles"
                    :loading-file-ids="loadingFileIds"
                    :delete-disabled="draftBusy || invoiceFinalizeUnconfirmed"
                    @delete="handleDeleteFile"
                  />
                </ul>

                <div class="flex flex-wrap items-center justify-between gap-4">
                  <p
                    id="invoice-selection-hint"
                    role="status"
                    class="text-sm text-muted"
                  >
                    {{ invoiceFinalizeUnconfirmed ? 'Open the reviewed set again to check its submission.' : invoiceSelectionHint }}
                  </p>
                  <UButton
                    size="xl"
                    label="Process"
                    trailing-icon="lucide:chevron-right"
                    class="ml-auto"
                    aria-describedby="invoice-selection-hint"
                    :loading="loading.upload"
                    :disabled="Boolean(invoiceSelectionHint) || draftBusy"
                    @click="processProps.onOpen"
                  />
                </div>
              </div>
              <div
                v-else
                ref="dropZoneRef"
                class="relative rounded-lg transition-all"
                :class="[isOverDropZone && ' bg-primary/5']"
              >
                <UFileUpload
                  v-model="fileQueue"
                  size="xl"
                  multiple
                  layout="list"
                  :label="`Drop your ${docTypeLabel} here`"
                  :class="[stagedFiles.length > 0 && 'hidden']"
                  :ui="{
                    root: tw`gap-5`,
                  }"
                  :disabled="draftBusy || step !== 'upload'"
                  :accept="fileInfo.accept.join(',')"
                >
                  <template #description>
                    <section class="flex flex-col gap-4">
                      <span>or click to browse from your computer</span>
                      <span>Support only PDF up to {{ fileInfo.size }} MB</span>
                    </section>
                  </template>
                </UFileUpload>

                <section
                  v-if="pendingFiles.length"
                  class="mt-6 space-y-3"
                >
                  <div class="flex items-center gap-2 text-primary">
                    <UIcon
                      name="lucide:loader"
                      class="animate-spin"
                    />
                    <span class="font-medium">Uploading {{ pendingFiles.length }} file(s)...</span>
                  </div>
                  <ul class="space-y-2">
                    <li
                      v-for="file in pendingFiles"
                      :key="`pending-${file.lastModified}-${file.name}`"
                      class="p-4 bg-elevated/50 flex items-center gap-4 border border-default rounded-lg animate-pulse"
                    >
                      <UBadge
                        icon="lucide:file"
                        color="neutral"
                        variant="soft"
                        size="xl"
                      />
                      <section class="space-y-1 flex-1">
                        <h1 class="text-highlighted break-all">
                          {{ file.name }}
                        </h1>
                        <div class="flex items-center gap-4 flex-wrap">
                          <span class="text-muted text-sm font-semibold">{{ humanFileSize(file.size) }}</span>
                          <div class="flex items-center gap-1">
                            <UIcon
                              name="lucide:loader"
                              class="animate-spin text-primary text-sm"
                            />
                            <span class="text-sm text-muted">Uploading...</span>
                          </div>
                        </div>
                      </section>
                    </li>
                  </ul>
                </section>

                <section
                  v-if="stagedFiles.length"
                  class="mt-6 space-y-4"
                >
                  <ul class="space-y-4">
                    <UploadedFileInfo
                      :files="stagedFiles"
                      :show="{
                        delete: true,
                        success: true,
                      }"
                      :loading-file-ids="loadingFileIds"
                      :delete-disabled="draftBusy"
                      @delete="handleDeleteFile"
                    />
                    <!-- Upload another file button -->
                    <li>
                      <UButton
                        block
                        variant="soft"
                        color="neutral"
                        icon="lucide:plus"
                        label="Upload another file"
                        :ui="{ base: 'py-4 border border-default text-muted hover:text-primary transition-all' }"
                        :disabled="draftBusy"
                        @click="openUploadDialog"
                      />
                    </li>
                  </ul>

                  <section class="flex items-center justify-between gap-4 pt-8 text-sm text-muted">
                    <div class="flex items-center gap-2">
                      <span>Total File Uploaded:</span>
                      <span class="text-primary font-semibold text-base">{{ fileCount }}</span>
                    </div>

                    <div class="flex items-center gap-2">
                      <span>Estimated Time:</span>
                      <span class="text-primary font-semibold text-base">{{ formattedEta }}</span>
                    </div>

                    <div class="flex items-center gap-2">
                      <span>Processing Cost:</span>
                      <div class="flex items-center gap-1 text-primary font-semibold text-base">
                        <LogoBadge src="img/coin.png" />
                        {{ formattedCredits }}
                      </div>
                    </div>
                  </section>

                  <section class="w-full flex items-center justify-between pt-4">
                    <UButton
                      label="Back"
                      variant="ghost"
                      color="neutral"
                      icon="lucide:arrow-left"
                      :to="toRoute('/workspace')"
                    />

                    <UButton
                      size="xl"
                      label="Process"
                      trailing-icon="lucide:chevron-right"
                      :disabled="draftBusy"
                      @click="processProps.onOpen"
                    />
                  </section>
                </section>

                <div
                  v-if="isOverDropZone"
                  class="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/80 dark:bg-canvas/80 backdrop-blur-sm rounded-lg border-2 border-primary border-dashed animate-in fade-in zoom-in duration-200 pointer-events-none"
                >
                  <div class="w-20 h-20 rounded-full bg-primary/10 text-primary animate-bounce flex items-center justify-center">
                    <UIcon
                      name="lucide:upload-cloud"
                      class="w-8! h-8!"
                    />
                  </div>
                  <h3 class="text-lg font-bold text-primary">
                    Drop your files here
                  </h3>
                </div>
              </div>
            </LayoutWrapper>
          </template>

          <template #process>
            <section class="space-y-20">
              <ExtractionFileProcessing
                :formatted-id="formattedId"
                :status="currentStatus"
                :progress="progressValue"
                :estimated-seconds="summaryJob?.totalEstimatedSeconds ?? null"
                :error-message="processingError"
              />

              <!-- <UAlert
                v-if="processingError"
                title="Processing error"
                color="error"
                variant="soft"
                icon="lucide:alert-triangle"
              >
                {{ processingError }}
              </UAlert> -->
            </section>
          </template>

          <template #completed>
            <section class="space-y-10">
              <ModalHeading
                :icon="verificationPending ? 'lucide:clock' : statusValue.icon"
                :title="verificationPending ? 'Verifying your document' : statusValue.label"
                :color="verificationPending ? 'info' : statusValue.color"
              >
                <template #description="{ item }">
                  <p
                    v-if="verificationPending"
                    :class="item.description"
                  >
                    The verified workbook will be available here and in Activity History.
                  </p>
                  <p
                    v-else
                    :class="item.description"
                  >
                    Processing <span class="font-semibold text-primary">{{ }}</span>
                    <template v-if="currentStatus === 'COMPLETED'">
                      has been completed successfully and ready for export.
                    </template>
                    <template v-else-if="currentStatus === 'PARTIAL_COMPLETED'">
                      completed with some files failed. {{ processingError || 'Successfully processed files are available for export.' }}
                    </template>
                    <template v-else-if="currentStatus === 'FAILED' || currentStatus === 'REJECTED'">
                      was unable to complete. {{ processingError || 'Please try again later.' }}
                    </template>
                    <template v-else>
                      is finishing up. Please wait while we fetch the result.
                    </template>
                  </p>

                  <UButton
                    :label="invoiceFailed ? 'Replace files and try again' : isInvoice ? 'Process another invoice set' : 'Process another file'"
                    variant="link"
                    color="neutral"
                    class="underline"
                    @click="onProcessAnotherFile"
                  />
                </template>
              </ModalHeading>

              <section>
                <template v-if="result">
                  <ExtractionFileInfo
                    :item="result"
                  />
                </template>
                <template v-else>
                  <EmptyData />
                </template>
              </section>
            </section>
          </template>
        </UStepper>
      </LayoutContent>

      <ModalContent v-model:open="open.process">
        <template #default="{ close }">
          <main class="flex flex-col gap-10">
            <ModalHeading
              icon="lucide:info"
              color="success"
              title="Review Before Processing"
            >
              <template #description="{ item }">
                <p :class="item.description">
                  <template v-if="isInvoice">
                    Check the invoice and packing list files before processing.
                  </template>
                  <template v-else>
                    Confirm your uploaded file matches the selected type: <span class="text-primary font-semibold">{{ docTypeLabel }}</span>
                  </template>
                </p>
                <p
                  v-if="insufficientToken"
                  :class="item.description"
                >
                  <span class="text-error font-semibold">Insufficient tokens.</span>
                  {{ isInvoice ? 'Contact sales to purchase more tokens.' : 'Please reduce file count or contact sales to purchase more tokens.' }}
                </p>
                <p
                  v-if="invoiceFinalizeUnconfirmed"
                  :class="item.description"
                  role="status"
                >
                  Submission could not be verified. Confirm the same set again to check its submission.
                </p>
              </template>
            </ModalHeading>

            <section class="space-y-2">
              <h1 class="text-muted font-semibold">
                {{ isInvoice ? 'Invoice set' : 'File Uploaded' }}
              </h1>
              <ul class="space-y-4">
                <UploadedFileInfo
                  :files="reviewFiles"
                  :show="{
                    delete: false,
                    success: false,
                  }"
                />
              </ul>
            </section>

            <footer class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UButton
                block
                label="Cancel"
                variant="outline"
                color="neutral"
                @click="close"
              />

              <template v-if="insufficientToken">
                <UButton
                  label="Contact Sale"
                  icon="lucide:arrow-right"
                  block
                  @click="onOpenContactSale"
                />
              </template>

              <template v-else>
                <UButton
                  block
                  class="whitespace-nowrap"
                  :loading="loading.finalize"
                  @click="processProps.onConfirm"
                >
                  Confirm (<LogoBadge
                    src="/img/coin.png"
                    size="xs"
                  /> {{ formattedCredits }})
                </UButton>
              </template>
            </footer>
          </main>
        </template>
      </ModalContent>

      <ModalContent v-model:open="open.submit">
        <template #default="{ close }">
          <main class="flex flex-col gap-5">
            <ModalHeading
              title="Successfully Submitted!"
              description="Your data have been successfully submitted to the ERP system."
              icon="lucide:circle-check"
            />

            <UButton
              label="Done"
              size="lg"
              block
              color="neutral"
              @click="close"
            />
          </main>
        </template>
      </ModalContent>
    </template>
  </UDashboardPanel>
</template>
