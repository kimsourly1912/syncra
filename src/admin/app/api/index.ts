import { createApiClient } from './client'
import type { ApiClient, ApiClientOptions } from './client'

// The API layer: the generated contract (`pnpm --filter admin api:gen`), feature-model helpers,
// errors, and the client. Everything API-related is imported from '@/api'.
export type * as Api from './generated/types.gen'
export * from './generated/valibot.gen'
export { defineModel, parseData } from './contract'
export type { ApiErrorBody } from './contract'
export { ApiError, errorMessage } from './errors'
export type { ApiErrorKind } from './errors'
export { createApiClient } from './client'
export type { ApiClient, ApiClientOptions, ApiResult, RequestOptions } from './client'

let client: ApiClient | undefined

/** Set once by plugins/session.client.ts. Admin is SPA-only, so one client serves the one user. */
export function configureApi(options: ApiClientOptions) {
  client = createApiClient(options)
}

function configured(): ApiClient {
  if (!client) throw new Error('The API was called before plugins/session.client.ts configured it.')
  return client
}

/**
 * Calls the Syncra API. Resolves to the request's `model` output; throws `ApiError`.
 * Works anywhere, including after an `await`: it needs no Nuxt context.
 *
 * @example
 * const review = await api.get(`admin/docai/techpack-reviews/${fileId}`, { model: reviewItemModel, signal })
 * await api.post('admin/auth/login', { body, auth: false })
 */
export const api: ApiClient = {
  get: (endpoint, options) => configured().get(endpoint, options),
  post: (endpoint, options) => configured().post(endpoint, options),
  put: (endpoint, options) => configured().put(endpoint, options),
  patch: (endpoint, options) => configured().patch(endpoint, options),
  delete: (endpoint, options) => configured().delete(endpoint, options),
  download: (endpoint, options) => configured().download(endpoint, options),
}
