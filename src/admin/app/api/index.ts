import type { $Fetch } from 'ofetch'
import { createApiClient } from './client'
import type { ApiClientOptions } from './client'

// The API layer: the generated contract (`pnpm --filter admin api:gen`), feature-model helpers,
// errors, and the client. Everything API-related is imported from '@/api'.
export type * as Api from './generated/types.gen'
export * from './generated/valibot.gen'
export { defineModel, parseData } from './contract'
export type { ApiErrorBody } from './contract'
export { ApiError, errorMessage } from './errors'
export type { ApiErrorKind } from './errors'
export { createApiClient } from './client'
export type { ApiClient, ApiClientOptions, ApiPath, Method, RequestOptions } from './client'

let config: Omit<ApiClientOptions, 'lockName'> | undefined

function configured() {
  if (!config) throw new Error('The API was called before plugins/session.client.ts configured it.')
  return config
}

/** Set once by plugins/session.client.ts (tests set a fake transport). Admin is SPA-only, so one client serves the one user. */
export function configureApi(options: Omit<ApiClientOptions, 'lockName'>) {
  config = options
}

/**
 * Calls the Syncra API. Paths, path parameters, query, and body are checked against the spec
 * (`generated/endpoints.gen.ts`). Resolves to the `model` output; throws `ApiError`. Needs no
 * Nuxt context, so it works after an `await`.
 *
 * @example
 * const review = await api.get('/admin/docai/techpack-reviews/{fileId}', { path: { fileId }, model: reviewItemModel, signal })
 * await api.post('/admin/auth/login', { body, auth: false })
 */
export const api = createApiClient({
  fetch: ((request, options) => configured().fetch(request, options)) as $Fetch,
  renew: () => configured().renew(),
  onExpired: () => configured().onExpired(),
})
