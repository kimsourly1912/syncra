import type { $Fetch } from 'ofetch'
import { vi } from 'vitest'
import { configureApi } from '@/api'

type Responder = unknown | ((options: { method?: string, query?: unknown, body?: unknown }) => unknown)

/**
 * Replaces the API transport, so tests run the real client, envelopes, and models without a
 * server. Keys are `METHOD /admin/path` with the path filled in (`GET /admin/docai/techpack-reviews/101`).
 * A value is the response body, or a function returning it. Throw from a function (or reject) to fail the request. Unknown requests fail loudly.
 */
export function fakeApi(responses: Record<string, Responder> = {}) {
  const transport = vi.fn(async (endpoint: string, options: { method?: string } = {}) => {
    const key = `${options.method ?? 'GET'} ${endpoint}`
    if (!(key in responses)) throw new Error(`Unexpected request: ${key}`)
    const response = responses[key]
    return typeof response === 'function' ? response(options) : response
  })
  const onExpired = vi.fn()
  configureApi({ fetch: transport as unknown as $Fetch, renew: vi.fn(async () => {}), onExpired })
  return { transport, responses, onExpired }
}

/** A `ResponseMsg*` success envelope. */
export const ok = (data: unknown = null) => ({ success: true, msg: 'ok', reason: null, data })

/** A `ResponseMsg*` resolved failure. */
export const refused = (reason: string) => ({ success: false, msg: null, reason, data: null })

/** What ofetch throws for an HTTP error. */
export function httpError(status: number, data?: unknown) {
  return Object.assign(new Error(`HTTP ${status}`), { name: 'FetchError', response: { status }, data })
}
