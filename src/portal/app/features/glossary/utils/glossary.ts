import type { GlossaryDTO } from '@/types/dto'

export const GLOSSARY_REMOVAL_CONFIRM_THRESHOLD = 10

const statusColors = {
  PREVIEW: 'warning',
  APPLIED: 'success',
  SUPERSEDED: 'neutral',
  DISCARDED: 'error',
} as const

const layerColors = {
  COMPANY_BRAND: 'primary',
  COMPANY_WIDE: 'info',
  GLOBAL: 'neutral',
} as const

export function glossaryStatusColor(status: GlossaryDTO.GlossaryUploadStatus) {
  return statusColors[status]
}

export function glossaryLayerColor(layer: GlossaryDTO.GlossaryLayer) {
  return layerColors[layer]
}

export function hasGlossaryChanges(counts: GlossaryDTO.GlossaryCounts) {
  return counts.added + counts.changed + counts.removed > 0
}

export function canRevertGlossaryUpload(status: GlossaryDTO.GlossaryUploadStatus) {
  return status === 'APPLIED' || status === 'SUPERSEDED'
}

export function requiresTypedGlossaryRemovalConfirmation(removedCount: number) {
  return removedCount >= GLOSSARY_REMOVAL_CONFIRM_THRESHOLD
}

export function glossaryScopeQuery(mode: 'company' | 'brand', brand: string) {
  const normalizedBrand = brand.trim()
  return mode === 'brand' && normalizedBrand ? { brand: normalizedBrand } : {}
}

export function isGlossaryPreview(value: unknown): value is GlossaryDTO.GlossaryPreview {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<GlossaryDTO.GlossaryPreview>
  return typeof candidate.uploadId === 'number'
    && typeof candidate.status === 'string'
    && !!candidate.counts
    && Array.isArray(candidate.blockingErrors)
}

function previewFromEnvelope(value: unknown): GlossaryDTO.GlossaryPreview | null {
  if (isGlossaryPreview(value)) return value
  if (!value || typeof value !== 'object') return null
  return isGlossaryPreview((value as { data?: unknown }).data)
    ? (value as { data: GlossaryDTO.GlossaryPreview }).data
    : null
}

export function previewFromUploadError(error: unknown) {
  const candidate = error as { data?: unknown, response?: { _data?: unknown } }
  return previewFromEnvelope(candidate.data)
    ?? previewFromEnvelope(candidate.response?._data)
}

const previewStash = new Map<number, GlossaryDTO.GlossaryPreview>()

export function stashGlossaryPreview(preview: GlossaryDTO.GlossaryPreview) {
  previewStash.set(preview.uploadId, preview)
}

export function readStashedGlossaryPreview(uploadId: number) {
  return previewStash.get(uploadId) ?? null
}

export function glossaryErrorCode(error: unknown) {
  const candidate = error as { data?: { msg?: unknown } }
  return typeof candidate.data?.msg === 'string' ? candidate.data.msg : ''
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
