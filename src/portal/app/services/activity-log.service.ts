import type { ActivityLogDTO } from '@/types/dto'

export const ENDPOINT = {
  prefix: '/companies',
  parts: {
    activityLogs: 'activity-logs',
    export: 'export',
  },
} as const

type Parts = typeof ENDPOINT.parts

export function getActivityLogs(param: { companyId: number }, query: Record<string, any> = {}) {
  const { companyId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'activity-logs'])
  return useAPI<ActivityLogDTO.ActivityLogListRes>(endpoint, {
    method: 'GET',
    query,
  })
}

export interface ExportFile {
  blob: Blob
  filename: string | null
}

function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null
  const match = /filename\s*=\s*"?([^";]+)"?/i.exec(header)
  return match?.[1]?.trim() ?? null
}

export async function exportActivityLogs(param: { companyId: number }, query: Record<string, any> = {}): Promise<ExportFile> {
  const { companyId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'activity-logs', 'export'])
  const { $api } = useNuxtApp()
  const res = await $api.raw(endpoint, {
    method: 'GET',
    query,
    responseType: 'blob',
  })

  return {
    blob: res._data as Blob,
    filename: parseContentDispositionFilename(res.headers.get('content-disposition')),
  }
}
