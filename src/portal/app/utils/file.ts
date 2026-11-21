import type { AcceptLiteral } from '~/types/common'

export interface ExtractFileHeaderReturn {
  file: Blob
  unit: string
  size: number
  type: string
  unitSize: string
  extension: FileExtension
  fileName: AcceptLiteral<'unknown'>
}

type FileExtension = 'pdf' | 'png' | 'jpg' | 'zip' | 'xlsx' | 'unknown'

export function getFileExtension(type: string): FileExtension {
  const map: Record<string, FileExtension> = {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'application/zip': 'zip',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  }
  return map[type] ?? 'unknown'
}

export function getFileName(disposition: string | null): AcceptLiteral<'unknown'> {
  if (!disposition) return 'unknown'

  const filenameStarMatch = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  if (filenameStarMatch?.[1]) {
    return decodeURIComponent(filenameStarMatch[1])
  }

  // Standard filename=
  const filenameMatch = disposition.match(/filename\s*=\s*("?)([^";]+)\1/i)
  if (filenameMatch?.[2]) {
    return filenameMatch[2]
  }

  return 'unknown'
}

export function extractFileInfo(response: Response, blob: Blob): ExtractFileHeaderReturn {
  const { size, unit } = parseFileSize(blob.size)
  const disposition = response.headers.get('content-disposition')
  const fileName = getFileName(disposition)

  return {
    size,
    unit,
    fileName,
    file: blob,
    type: blob.type,
    unitSize: humanFileSize(blob.size),
    extension: getFileExtension(blob.type),
  }
}
