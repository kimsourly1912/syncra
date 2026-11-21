import type { DocAIDTO } from '@/types/dto'
import type { BaseRes } from '@/types/dto/base.dto'

const ENDPOINT = {
  prefix: '/companies',
  parts: {
    docai: 'docai',
    jobs: 'jobs',
    files: 'files',
    result: 'result',
    status: 'status',
    finalize: 'finalize',
    processors: 'processors',
    download: 'download',
    erpExport: 'erp-export',
  },
} as const

type Parts = typeof ENDPOINT.parts

export function createJob(param: DocAIDTO.DocAIParam, query: { type: DocAIDTO.DocType }) {
  const { companyId } = param
  if (!companyId) throw new Error('DocAI: companyId is required')
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', 'jobs'])
  return useAPI<DocAIDTO.CreateJobRes>(endpoint, {
    method: 'POST',
    query,
  })
}

export function listFiles(param: DocAIDTO.JobParam) {
  const { companyId, jobId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', 'jobs', jobId, 'files'])
  return useAPI<DocAIDTO.StagedJobRes>(endpoint, { method: 'GET' })
}

export function addFiles(param: DocAIDTO.JobParam, docType: DocAIDTO.DocType, files: File[] | FormData, uploadRequestId?: string) {
  const { companyId, jobId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', 'jobs', jobId, 'files'])
  const body = files instanceof FormData
    ? files
    : (() => {
        const formData = new FormData()
        files.forEach(file => formData.append('files', file))
        return formData
      })()

  if (uploadRequestId)
    body.set('uploadRequestId', uploadRequestId)

  return useAPI<DocAIDTO.StagedJobRes>(endpoint, {
    method: 'POST',
    body,
    query: { type: docType },
  })
}

export function removeFile(param: DocAIDTO.FileParam, query?: { draftOnly: boolean }) {
  const { companyId, jobId, fileId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', 'jobs', jobId, 'files', fileId])
  return useAPI<DocAIDTO.StagedJobRes>(endpoint, { method: 'DELETE', ...(query && { query }) })
}

export function finalizeJob(param: DocAIDTO.JobParam, query?: { expectedFileId: number }) {
  const { companyId, jobId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', 'jobs', jobId, 'finalize'])
  return useAPI<DocAIDTO.FinalizeJobRes>(endpoint, { method: 'POST', ...(query && { query }) })
}

export function getJobStatus(param: DocAIDTO.JobParam) {
  const { companyId, jobId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', jobId, 'status'])
  return useAPI<DocAIDTO.JobStatusRes>(endpoint, { method: 'GET' })
}

export function getJobResult(param: DocAIDTO.JobParam) {
  const { companyId, jobId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', jobId, 'result'])
  return useAPI<DocAIDTO.JobResultRes>(endpoint, { method: 'GET' })
}

export function getActivitiesHistory(param: DocAIDTO.DocAIParam, query: DocAIDTO.JobActivityHistoryQuery) {
  const { companyId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', 'jobs'])
  return useAPI<DocAIDTO.JobActivityHistoryRes>(endpoint, { method: 'GET', query })
}

export function getProcessors(param: DocAIDTO.DocAIParam) {
  const { companyId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', 'processors'])
  return useAPI<DocAIDTO.ProcessorRes>(endpoint, { method: 'GET' })
}

export function softDeleteFile(param: DocAIDTO.FileParam) {
  const { companyId, jobId, fileId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', 'jobs', jobId, 'files', fileId, 'soft'])
  return useAPI<unknown>(endpoint, { method: 'DELETE' })
}

export function exportFileToERP(param: DocAIDTO.FileParam) {
  const { companyId, jobId, fileId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', 'jobs', jobId, 'files', fileId, 'erp-export'])
  return useAPI<DocAIDTO.ErpExportRes>(endpoint, { method: 'POST' })
}

export function discardDraft(
  param: DocAIDTO.DocAIParam,
  query: { type: 'INVOICE', expectedJobId: number } | { type: Exclude<DocAIDTO.DocType, 'INVOICE'> },
) {
  const { companyId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', 'jobs', 'draft'])
  return useAPI<unknown>(endpoint, {
    method: 'DELETE',
    query,
  })
}

export function getCurrentDraft(
  param: DocAIDTO.DocAIParam,
  query: { type: DocAIDTO.DocType },
) {
  const { companyId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', 'jobs', 'draft'])
  return useAPI<BaseRes<DocAIDTO.JobSummary | null>>(endpoint, {
    method: 'GET',
    query,
  })
}

export function bulkDeleteJobFiles(param: DocAIDTO.BulkDeleteJobFilesParam) {
  const { companyId, jobId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', 'jobs', jobId, 'files'])
  return useAPI<DocAIDTO.BulkDeleteJobFilesRes>(endpoint, { method: 'DELETE' })
}

export interface BulkDownloadResult {
  blob: Blob
  filename: string | null
}

function parseContentDispositionFilename(header: string | null) {
  if (!header) return null
  const filenameMatch = /filename\s*=\s*"?([^";]+)"?/i.exec(header)
  if (filenameMatch?.[1])
    return filenameMatch[1].trim()
  return null
}

export async function bulkDownloadJobFiles(param: DocAIDTO.BulkDownloadJobFilesParam): Promise<BulkDownloadResult> {
  const { $api } = useNuxtApp()
  const { companyId, jobId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', jobId, 'files', 'download'])
  const res = await $api.raw(endpoint, {
    method: 'GET',
    responseType: 'blob',
  })

  return {
    blob: res._data as Blob,
    filename: parseContentDispositionFilename(res.headers.get('content-disposition')),
  }
}
