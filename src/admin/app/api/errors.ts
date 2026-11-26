import type { FetchError } from 'ofetch'
import type { ApiErrorBody } from './contract'

/** What went wrong, however the API reported it. */
export type ApiErrorKind
  = | 'network' // no response: offline, DNS, CORS
    | 'timeout'
    | 'aborted' // cancelled by the app
    | 'unauthorized' // 401: no session, or it can't be renewed
    | 'forbidden' // 403
    | 'not_found'
    | 'validation' // 400, 422
    | 'conflict' // 409
    | 'rate_limited' // 429: transient, never a refusal
    | 'rejected' // the API refused: a `success: false` envelope, or another 4xx
    | 'server' // 5xx without an envelope
    | 'contract' // the response doesn't match the feature's model
    | 'unknown'

const MESSAGES: Record<ApiErrorKind, string> = {
  network: 'Can\'t reach the server. Check your connection and try again.',
  timeout: 'The server took too long to respond. Please try again.',
  aborted: 'The request was cancelled.',
  unauthorized: 'Your session has expired. Please sign in again.',
  forbidden: 'You don\'t have permission to do this.',
  not_found: 'The requested item was not found.',
  validation: 'Some of the submitted data is invalid.',
  conflict: 'This change conflicts with the current data. Reload and try again.',
  rate_limited: 'Too many requests. Wait a moment and try again.',
  rejected: 'The request could not be completed.',
  server: 'Something went wrong on the server. Please try again.',
  contract: 'The server sent an unexpected response.',
  unknown: 'Something went wrong. Please try again.',
}

/** Kinds whose server `reason` is meant for the user. */
const USER_FACING = new Set<ApiErrorKind>(['rejected', 'validation', 'not_found', 'forbidden', 'conflict'])

interface ApiErrorInit {
  kind: ApiErrorKind
  /** Overrides the message built from `kind` and `reason`. */
  message?: string
  /** HTTP status, or 0 without a response. */
  status?: number
  /** The API's own explanation (`reason`, `detail`, or `title`). */
  reason?: string
  /** The API's `msg` code, for logs. */
  code?: string
  /** `METHOD endpoint`, for logs and contract errors. */
  source?: string
  /** Contract mismatches, as `field.path: issue`. */
  issues?: string[]
  /** Shown to nobody: a cancelled request, or a session that ended and is already redirecting. */
  silent?: boolean
  cause?: unknown
}

/** The only error the API layer throws. `message` is always safe to show. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number
  readonly reason?: string
  readonly code?: string
  readonly source?: string
  readonly issues?: string[]
  readonly silent: boolean

  constructor(init: ApiErrorInit) {
    const reason = init.reason?.trim() || undefined
    super(init.message ?? (reason && USER_FACING.has(init.kind) ? reason : MESSAGES[init.kind]), { cause: init.cause })
    this.name = 'ApiError'
    this.kind = init.kind
    this.status = init.status ?? 0
    this.reason = reason
    this.code = init.code
    this.source = init.source
    this.issues = init.issues
    this.silent = init.silent ?? init.kind === 'aborted'
  }

  /** A failure of the connection or the server, worth trying again; not a refusal. */
  get retryable() {
    return this.kind === 'network' || this.kind === 'timeout' || this.kind === 'server' || this.kind === 'rate_limited'
  }

  /** The same error, marked so no toast or alert shows it. */
  silenced() {
    return new ApiError({ ...this, message: this.message, silent: true, cause: this.cause })
  }

  /**
   * Normalizes anything thrown into an `ApiError`. Walks the `cause` chain, because wrappers hide
   * the original: `useAsyncData` rethrows failures through `createError`.
   */
  static from(error: unknown, source?: string): ApiError {
    for (let e: unknown = error, depth = 0; e && depth < 6; e = (e as { cause?: unknown }).cause, depth++) {
      if (e instanceof ApiError) return e
      if (isFetchError(e)) return fromFetchError(e, source)
    }
    return new ApiError({ kind: 'unknown', source, cause: error })
  }
}

/** The message for an inline alert: the API's reason when it has one, otherwise `fallback`. */
export function errorMessage(error: unknown, fallback?: string) {
  const e = ApiError.from(error)
  if ((e.reason && USER_FACING.has(e.kind)) || e.kind === 'contract') return e.message
  return fallback ?? e.message
}

// Duck-typed: Vite can load two copies of ofetch, so `instanceof FetchError` isn't reliable.
function isFetchError(error: unknown): error is FetchError {
  return error instanceof Error && error.name === 'FetchError'
}

function fromFetchError(error: FetchError, source?: string): ApiError {
  const status = error.response?.status ?? 0
  if (!status) {
    const name = (error.cause as Error | undefined)?.name
    const kind = name === 'AbortError' ? 'aborted' : name === 'TimeoutError' ? 'timeout' : 'network'
    return new ApiError({ kind, source, cause: error })
  }

  const body = (typeof error.data === 'object' && error.data !== null ? error.data : {}) as ApiErrorBody & { success?: unknown }
  return new ApiError({
    kind: kindOf(status, body.success === false),
    status,
    reason: body.reason || body.detail || body.title || undefined,
    code: body.msg || undefined,
    source,
    cause: error,
  })
}

// The API also answers refusals with a `success: false` envelope on 5xx statuses, so an
// envelope means "rejected" whatever the status. 401, 403, and 429 keep their meaning: a
// rate-limited session renewal must not read as refused and sign staff out.
function kindOf(status: number, envelope: boolean): ApiErrorKind {
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 429) return 'rate_limited'
  if (envelope) return 'rejected'
  if (status === 400 || status === 422) return 'validation'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 408 || status === 504) return 'timeout'
  if (status >= 500) return 'server'
  return 'rejected'
}
