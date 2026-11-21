import type { GlossaryDTO } from '@/types/dto'

const ENDPOINT = {
  prefix: '/companies',
  parts: {
    docai: 'docai',
    glossary: 'glossary',
    uploads: 'uploads',
    apply: 'apply',
    revert: 'revert',
    entries: 'entries',
    template: 'template',
  },
} as const

type Parts = typeof ENDPOINT.parts

function glossaryEndpoint(companyId: number, parts: Array<string | number> = []) {
  if (companyId <= 0) throw new Error('Glossary: companyId is required')
  return buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'docai', 'glossary', ...parts])
}

function withBrand<T extends { brand?: string }>(query: T): T {
  const brand = query.brand?.trim()
  return brand ? { ...query, brand } : { ...query, brand: undefined }
}

export function uploadGlossary(
  param: GlossaryDTO.GlossaryCompanyParam,
  file: File,
  query: GlossaryDTO.GlossaryScopeQuery = {},
) {
  const body = new FormData()
  body.append('file', file)
  return useAPI<GlossaryDTO.GlossaryPreviewRes>(glossaryEndpoint(param.companyId, ['uploads']), {
    method: 'POST',
    body,
    query: withBrand(query),
  })
}

export function getUpload(param: GlossaryDTO.GlossaryUploadParam) {
  return useAPI<GlossaryDTO.GlossaryPreviewRes>(
    glossaryEndpoint(param.companyId, ['uploads', param.uploadId]),
    { method: 'GET' },
  )
}

export function applyUpload(param: GlossaryDTO.GlossaryUploadParam) {
  return useAPI<GlossaryDTO.GlossaryPreviewRes>(
    glossaryEndpoint(param.companyId, ['uploads', param.uploadId, 'apply']),
    { method: 'POST' },
  )
}

export function discardUpload(param: GlossaryDTO.GlossaryUploadParam) {
  return useAPI<unknown>(
    glossaryEndpoint(param.companyId, ['uploads', param.uploadId]),
    { method: 'DELETE' },
  )
}

export function revertUpload(param: GlossaryDTO.GlossaryUploadParam) {
  return useAPI<GlossaryDTO.GlossaryPreviewRes>(
    glossaryEndpoint(param.companyId, ['uploads', param.uploadId, 'revert']),
    { method: 'POST' },
  )
}

export function getHistory(
  param: GlossaryDTO.GlossaryCompanyParam,
  query: GlossaryDTO.GlossaryHistoryQuery,
) {
  return useAPI<GlossaryDTO.GlossaryHistoryRes>(glossaryEndpoint(param.companyId, ['uploads']), {
    method: 'GET',
    query: withBrand(query),
  })
}

export function getEntries(
  param: GlossaryDTO.GlossaryCompanyParam,
  query: GlossaryDTO.GlossaryEntriesQuery,
) {
  return useAPI<GlossaryDTO.GlossaryEntriesRes>(glossaryEndpoint(param.companyId, ['entries']), {
    method: 'GET',
    query: withBrand(query),
  })
}

export async function downloadTemplate(
  param: GlossaryDTO.GlossaryCompanyParam,
): Promise<GlossaryDTO.GlossaryDownloadResult> {
  const result = await useFileAPI(glossaryEndpoint(param.companyId, ['template']))

  return {
    blob: result.file,
    filename: result.fileName === 'unknown' ? 'pom-glossary-template.xlsx' : result.fileName,
  }
}
