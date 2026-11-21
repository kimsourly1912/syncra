import type * as v from 'valibot'
import type { $Fetch, FetchOptions } from 'ofetch'
import { parseData } from './contract'
import { ApiError } from './errors'
import { createSessionRecovery } from './recovery'
import type { SessionRecoveryOptions } from './recovery'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestOptions {
  query?: object
  body?: FetchOptions['body']
  headers?: Record<string, string>
  signal?: AbortSignal
  timeout?: number
  /** What the feature needs from the response. Without one, the request resolves to nothing. */
  model?: v.GenericSchema
  /** `false` for the few endpoints whose body isn't a `ResponseMsg*` envelope. */
  envelope?: boolean
  /** `false` for the auth calls: a 401 is thrown as it is, with no session renewal. */
  auth?: boolean
}

/** A request resolves to its model's output, or to `undefined` when it declares no model. */
export type ApiResult<O> = O extends { model: infer S extends v.GenericSchema } ? v.InferOutput<S> : undefined

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

export function createApiClient({ fetch, lockName = 'syncra-admin:session-renewal', ...session }: ApiClientOptions) {
  const recovery = createSessionRecovery({ ...session, lockName })

  async function send(method: Method, endpoint: string, options: RequestOptions, responseType?: 'blob') {
    const source = `${method} ${endpoint}`
    const { model: _model, envelope: _envelope, auth = true, ...init } = options
    const attempt = async () => {
      try {
        return await fetch(endpoint, { ...init, method, responseType } as FetchOptions<'json'>)
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

  function unwrap(body: unknown, options: RequestOptions, source: string) {
    let data = body
    if (options.envelope !== false) {
      if (!isEnvelope(body)) throw new ApiError({ kind: 'contract', message: `Unexpected response from ${source} (not a response envelope)`, source })
      if (body.success !== true) {
        throw new ApiError({ kind: 'rejected', status: 200, reason: body.reason ?? undefined, code: body.msg ?? undefined, source })
      }
      data = body.data
    }
    return options.model ? parseData(options.model, data, source) : undefined
  }

  function request(method: Method) {
    return async <O extends RequestOptions = RequestOptions>(endpoint: string, options?: O): Promise<ApiResult<O>> => {
      const opts: RequestOptions = options ?? {}
      return unwrap(await send(method, endpoint, opts), opts, `${method} ${endpoint}`) as ApiResult<O>
    }
  }

  return {
    get: request('GET'),
    post: request('POST'),
    put: request('PUT'),
    patch: request('PATCH'),
    delete: request('DELETE'),
    /** A file. The body isn't an envelope and isn't parsed. */
    download: (endpoint: string, options: Omit<RequestOptions, 'model' | 'envelope'> = {}) =>
      send('GET', endpoint, options, 'blob') as Promise<Blob>,
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
