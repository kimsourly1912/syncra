import type * as v from 'valibot'
import type { $Fetch, FetchOptions } from 'ofetch'
import { parseData } from './contract'
import { ApiError } from './errors'
import { MULTIPART_ENDPOINTS, UNENVELOPED_ENDPOINTS } from './generated/endpoints.gen'
import type { Endpoints } from './generated/endpoints.gen'
import { createSessionRecovery } from './recovery'
import type { SessionRecoveryOptions } from './recovery'

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type Endpoint = keyof Endpoints & string

/** The spec's paths for one method, e.g. `ApiPath<'GET'>` includes `'/admin/docai/techpack-reviews/{fileId}'`. */
export type ApiPath<M extends Method> = Endpoint extends infer K ? K extends `${M} ${infer P}` ? P : never : never

/** The operation's own `path`, `query`, and `body`, generated from the spec. */
type OperationParams<M extends Method, P extends string> = Omit<Endpoints[`${M} ${P}` & Endpoint], 'url'>

interface CallOptions<S> {
  headers?: Record<string, string>
  signal?: AbortSignal
  timeout?: number
  /** What the feature needs from the response. Without one, the request resolves to `undefined`. */
  model?: S
  /**
   * Whether the body is a `ResponseMsg*` envelope to unwrap. Leave it out: the generated
   * `UNENVELOPED_ENDPOINTS` (from the spec) decides. Set it only where the spec is known to be wrong.
   */
  envelope?: boolean
  /** `false` for the calls that set or clear session cookies: a 401 is thrown as it is, with no renewal. */
  auth?: boolean
}

export type RequestOptions<M extends Method, P extends string, S = undefined> = OperationParams<M, P> & CallOptions<S>

/** Options are required when the operation has a required path, query, or body. */
type Args<M extends Method, P extends string, S> = Partial<OperationParams<M, P>> extends OperationParams<M, P>
  ? [options?: RequestOptions<M, P, S>]
  : [options: RequestOptions<M, P, S>]

type Result<S> = S extends v.GenericSchema ? v.InferOutput<S> : undefined

type Call<M extends Method> = <P extends ApiPath<M>, S extends v.GenericSchema | undefined = undefined>(path: P, ...args: Args<M, P, S>) => Promise<Result<S>>

type Download = <P extends ApiPath<'GET'>>(path: P, ...args: Args<'GET', P, undefined>) => Promise<Blob>

interface AnyOptions extends CallOptions<v.GenericSchema | undefined> {
  path?: Record<string, unknown>
  query?: Record<string, unknown>
  body?: unknown
}

export interface ApiClientOptions extends Omit<SessionRecoveryOptions, 'lockName'> {
  /** `$fetch.create({ baseURL, credentials: 'include', retry: false })` */
  fetch: $Fetch
  lockName?: string
}

interface Envelope {
  success?: unknown
  msg?: string | null
  reason?: string | null
  data?: unknown
}

function isEnvelope(value: unknown): value is Envelope {
  return typeof value === 'object' && value !== null && 'success' in value
}

/** `/admin/x/{fileId}` + `{ fileId: 7 }` → `/admin/x/7`. */
function fillPath(template: string, params: Record<string, unknown> = {}) {
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name]
    if (value === undefined || value === null || value === '') throw new Error(`${template}: path parameter "${name}" is missing`)
    return encodeURIComponent(String(value))
  })
}

function toFormData(body: Record<string, unknown>) {
  const form = new FormData()
  for (const [key, value] of Object.entries(body)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined && item !== null) form.append(key, item instanceof Blob ? item : String(item))
    }
  }
  return form
}

export function createApiClient({ fetch, lockName = 'syncra-admin:session-renewal', ...session }: ApiClientOptions) {
  const recovery = createSessionRecovery({ ...session, lockName })

  async function send(method: Method, template: string, options: AnyOptions, responseType?: 'blob') {
    // Errors name the template, not the filled path: `GET /admin/docai/techpack-reviews/{fileId}`.
    const source = `${method} ${template}`
    const { path, body, model: _model, envelope: _envelope, auth = true, ...init } = options
    const url = fillPath(template, path)
    const payload = MULTIPART_ENDPOINTS.has(source) && body && typeof body === 'object' && !(body instanceof FormData)
      ? toFormData(body as Record<string, unknown>)
      : body
    const attempt = async () => {
      try {
        return await fetch(url, { ...init, body: payload, method, responseType } as FetchOptions<'json'>)
      }
      catch (error) {
        throw ApiError.from(error, source)
      }
    }

    const checkpoint = recovery.checkpoint()
    try {
      return await attempt()
    }
    catch (error) {
      if (!auth || (error as ApiError).kind !== 'unauthorized') throw error
      if (await recovery.recover(checkpoint) === 'expired') throw (error as ApiError).silenced()
    }

    // Retried once. Refused again means the renewed session still isn't accepted.
    try {
      return await attempt()
    }
    catch (error) {
      if ((error as ApiError).kind !== 'unauthorized') throw error
      await recovery.expire()
      throw (error as ApiError).silenced()
    }
  }

  function unwrap(body: unknown, options: AnyOptions, source: string) {
    let data = body
    if (options.envelope ?? !UNENVELOPED_ENDPOINTS.has(source)) {
      if (!isEnvelope(body)) throw new ApiError({ kind: 'contract', message: `Unexpected response from ${source} (not a response envelope)`, source })
      if (body.success !== true) {
        throw new ApiError({ kind: 'rejected', status: 200, reason: body.reason ?? undefined, code: body.msg ?? undefined, source })
      }
      data = body.data
    }
    return options.model ? parseData(options.model, data, source) : undefined
  }

  function call<M extends Method>(method: M): Call<M> {
    return (async (path: string, options: AnyOptions = {}) =>
      unwrap(await send(method, path, options), options, `${method} ${path}`)) as Call<M>
  }

  return {
    get: call('GET'),
    post: call('POST'),
    put: call('PUT'),
    patch: call('PATCH'),
    delete: call('DELETE'),
    /** A file. The body isn't an envelope and isn't parsed. */
    download: (async (path: string, options: AnyOptions = {}) => send('GET', path, options, 'blob')) as Download,
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
