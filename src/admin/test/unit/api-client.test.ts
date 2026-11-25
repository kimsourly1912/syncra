import * as v from 'valibot'
import type { $Fetch } from 'ofetch'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, createApiClient, errorMessage } from '../../app/api'
import { acrossTabs } from '../../app/api/recovery'

/** What ofetch throws for an HTTP error. */
function httpError(status: number, data?: unknown) {
  return Object.assign(new Error(`HTTP ${status}`), { name: 'FetchError', response: { status }, data })
}

/** What ofetch throws when there's no response. */
function noResponse(causeName: string) {
  const cause = Object.assign(new Error(causeName), { name: causeName })
  return Object.assign(new Error('no response'), { name: 'FetchError', cause })
}

function deferred<T = undefined>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

const ok = (data: unknown) => ({ success: true, msg: 'ok', reason: null, data })
const itemModel = v.object({ id: v.number() })
const ITEM = '/admin/docai/techpack-reviews/{fileId}'
const item = (fileId: number) => ({ path: { fileId }, model: itemModel })

/** A client over a fixed transport, for the response and error tests. */
function clientReturning(respond: () => unknown) {
  const transport = vi.fn(async () => respond())
  return { transport, client: createApiClient({ fetch: transport as unknown as $Fetch, renew: vi.fn(), onExpired: vi.fn() }) }
}

/**
 * A fake API that answers 401 until `session.valid` is true, then the review whose id is in the
 * URL. `renew` is what the test passes; by default it makes the session valid.
 */
function setup(renew?: () => Promise<unknown>) {
  const session = { valid: false }
  const transport = vi.fn(async (url: string) => {
    if (!session.valid) throw httpError(401)
    return ok({ id: Number(url.split('/').pop()) })
  })
  const onExpired = vi.fn()
  const renewSpy = vi.fn(renew ?? (async () => {
    session.valid = true
  }))
  const client = createApiClient({ fetch: transport as unknown as $Fetch, renew: renewSpy, onExpired })
  return { session, transport, renew: renewSpy, onExpired, client }
}

describe('requests', () => {
  it('fills the path and returns the parsed model from a success envelope', async () => {
    const { session, client, transport } = setup()
    session.valid = true

    expect(await client.get(ITEM, item(7))).toEqual({ id: 7 })
    expect(transport).toHaveBeenCalledWith('/admin/docai/techpack-reviews/7', expect.objectContaining({ method: 'GET' }))
  })

  it('sends the query and body as given', async () => {
    const { transport, client } = clientReturning(() => ok(null))

    await client.get('/admin/docai/techpack-reviews', { query: { status: 'REVIEWED', page: 0 } })
    await client.post('/admin/docai/techpack-reviews/{fileId}/approve', { path: { fileId: 7 }, body: { draftUuid: 'd', sourceVerified: true } })

    expect(transport).toHaveBeenNthCalledWith(1, '/admin/docai/techpack-reviews', expect.objectContaining({ query: { status: 'REVIEWED', page: 0 } }))
    expect(transport).toHaveBeenNthCalledWith(2, '/admin/docai/techpack-reviews/7/approve', expect.objectContaining({
      method: 'POST', body: { draftUuid: 'd', sourceVerified: true },
    }))
  })

  it('resolves to nothing without a model', async () => {
    const { client } = clientReturning(() => ok({ anything: true }))

    expect(await client.post('/admin/auth/logout', { auth: false })).toBeUndefined()
  })

  it('encodes path parameters, and refuses a missing one before sending', async () => {
    const { transport, client } = clientReturning(() => ok(null))

    await client.delete('/admin/email-templates/{name}', { path: { name: 'a b/c' } })
    expect(transport).toHaveBeenCalledWith('/admin/email-templates/a%20b%2Fc', expect.anything())

    await expect(client.delete('/admin/email-templates/{name}', { path: { name: '' } })).rejects.toThrow('path parameter "name" is missing')
    expect(transport).toHaveBeenCalledOnce()
  })

  it('sends a multipart endpoint\'s body as FormData', async () => {
    const { transport, client } = clientReturning(() => ok(null))
    const workbook = new File(['x'], 'draft.xlsx')

    await client.post('/admin/docai/techpack-reviews/{fileId}/draft', { path: { fileId: 1 }, query: { draftUuid: 'd' }, body: { workbook } })

    const sent = (transport.mock.calls[0] as unknown[])[1] as { body: FormData }
    expect(sent.body).toBeInstanceOf(FormData)
    expect((sent.body.get('workbook') as File).name).toBe('draft.xlsx')
  })

  it('throws a rejected ApiError with the reason for a success: false envelope', async () => {
    const { client } = clientReturning(() => ({ success: false, msg: 'SC0001', reason: 'Review not found', data: null }))

    const error = await client.get(ITEM, item(7)).catch(e => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'rejected', reason: 'Review not found', code: 'SC0001', message: 'Review not found', source: `GET ${ITEM}` })
  })

  it('throws a contract ApiError naming the endpoint and field', async () => {
    const { client } = clientReturning(() => ok({ id: null }))

    await expect(client.get(ITEM, item(7))).rejects.toMatchObject({
      kind: 'contract',
      message: expect.stringMatching(/^Unexpected response from GET \/admin\/docai\/techpack-reviews\/\{fileId\} \(id: /),
    })
  })

  it('parses a body without an envelope when asked', async () => {
    const { client } = clientReturning(() => ({ id: 3 }))

    expect(await client.get('/admin/users/me/profile', { model: itemModel, envelope: false })).toEqual({ id: 3 })
  })

  it('reads an endpoint the spec marks as unenveloped without being told', async () => {
    const { client } = clientReturning(() => ({ id: 3 }))

    expect(await client.get('/admin/sale-requests/{id}', { path: { id: 3 }, model: itemModel })).toEqual({ id: 3 })
  })

  it('still expects an envelope from an enveloped endpoint', async () => {
    const { client } = clientReturning(() => ({ id: 3 }))

    await expect(client.get('/admin/users/me/profile', { model: itemModel })).rejects.toMatchObject({ kind: 'contract' })
  })

  it('downloads a blob without parsing it', async () => {
    const blob = new Blob(['x'])
    const { transport, client } = clientReturning(() => blob)

    expect(await client.download('/admin/docai/techpack-reviews/{fileId}/source', { path: { fileId: 1 } })).toBe(blob)
    expect(transport).toHaveBeenCalledWith('/admin/docai/techpack-reviews/1/source', expect.objectContaining({ method: 'GET', responseType: 'blob' }))
  })
})

describe('ApiError', () => {
  it.each([
    [httpError(400), 'validation'],
    [httpError(403), 'forbidden'],
    [httpError(404), 'not_found'],
    [httpError(409), 'conflict'],
    [httpError(500), 'server'],
    [httpError(500, { success: false, reason: 'refreshToken blank' }), 'rejected'],
    [noResponse('AbortError'), 'aborted'],
    [noResponse('TimeoutError'), 'timeout'],
    [noResponse('TypeError'), 'network'],
    [new Error('bug'), 'unknown'],
  ])('classifies %s', (error, kind) => {
    expect(ApiError.from(error).kind).toBe(kind)
  })

  it('finds the API error inside a wrapper (useAsyncData rethrows through createError)', () => {
    const wrapped = Object.assign(new Error('wrapped'), { cause: httpError(404, { reason: 'Review not found' }) })

    expect(ApiError.from(wrapped)).toMatchObject({ kind: 'not_found', message: 'Review not found' })
  })

  it('shows the server reason only for user-facing kinds', () => {
    expect(ApiError.from(httpError(409, { reason: 'Draft changed' })).message).toBe('Draft changed')
    expect(ApiError.from(httpError(500, { detail: 'NullPointerException' })).message).toBe('Something went wrong on the server. Please try again.')
  })

  it('keeps cancelled requests silent, and marks connection failures retryable', () => {
    expect(ApiError.from(noResponse('AbortError')).silent).toBe(true)
    expect(ApiError.from(httpError(500)).silent).toBe(false)
    expect(ApiError.from(noResponse('TypeError')).retryable).toBe(true)
    expect(ApiError.from(httpError(404)).retryable).toBe(false)
  })

  it('gives inline alerts the reason, or the screen fallback', () => {
    expect(errorMessage(httpError(404, { reason: 'Review not found' }), 'Could not open.')).toBe('Review not found')
    expect(errorMessage(httpError(500), 'Could not open.')).toBe('Could not open.')
  })
})

describe('session renewal', () => {
  it('passes other errors through without renewing', async () => {
    const transport = vi.fn(async () => {
      throw httpError(500)
    })
    const renew = vi.fn()
    const client = createApiClient({ fetch: transport as unknown as $Fetch, renew, onExpired: vi.fn() })

    await expect(client.get(ITEM, item(1))).rejects.toMatchObject({ kind: 'server' })
    expect(renew).not.toHaveBeenCalled()
  })

  it('shares one renewal between concurrent 401s and retries each request', async () => {
    const gate = deferred()
    const { session, transport, renew, onExpired, client } = setup(async () => {
      await gate.promise
      session.valid = true
    })

    const requests = Promise.all([1, 2, 3].map(id => client.get(ITEM, item(id))))
    await vi.waitFor(() => expect(transport).toHaveBeenCalledTimes(3))
    gate.resolve(undefined)

    expect(await requests).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    expect(renew).toHaveBeenCalledOnce()
    expect(transport).toHaveBeenCalledTimes(6)
    expect(onExpired).not.toHaveBeenCalled()
  })

  it('retries without renewing again when a renewal finished while the request was in flight', async () => {
    const late = deferred()
    const { session, transport, renew, client } = setup()
    transport.mockImplementationOnce(async () => {
      await late.promise
      throw httpError(401) // answered for the old cookies
    })

    const slow = client.get(ITEM, item(9))
    await client.get(ITEM, item(1))
    late.resolve(undefined)

    expect(await slow).toEqual({ id: 9 })
    expect(session.valid).toBe(true)
    expect(renew).toHaveBeenCalledOnce()
  })

  it.each([
    ['a success: false envelope', () => Promise.reject(new ApiError({ kind: 'rejected', status: 200 }))],
    ['a 401', () => Promise.reject(httpError(401))],
    ['the API\'s 500 with a success: false envelope', () => Promise.reject(httpError(500, { success: false, reason: 'refreshToken blank' }))],
  ])('ends the session when the renewal is refused with %s', async (_, renew) => {
    const { transport, onExpired, client } = setup(renew)

    const error = await client.get(ITEM, item(1)).catch(e => e)
    expect(error).toMatchObject({ kind: 'unauthorized', silent: true })
    expect(transport).toHaveBeenCalledOnce()
    expect(onExpired).toHaveBeenCalledOnce()
  })

  it('keeps the session when the renewal fails for a transient reason', async () => {
    const { onExpired, client } = setup(() => Promise.reject(noResponse('TypeError')))

    await expect(client.get(ITEM, item(1))).rejects.toMatchObject({ kind: 'network', silent: false })
    expect(onExpired).not.toHaveBeenCalled()
  })

  it('retries only once, and ends the session if the retry is refused too', async () => {
    const { transport, onExpired, client } = setup(async () => {})

    await expect(client.get(ITEM, item(1))).rejects.toMatchObject({ kind: 'unauthorized', silent: true })
    expect(transport).toHaveBeenCalledTimes(2)
    expect(onExpired).toHaveBeenCalledOnce()
  })

  it('starts a new renewal after the previous one settled', async () => {
    const { renew, client } = setup(() => Promise.reject(httpError(401)))

    await expect(client.get(ITEM, item(1))).rejects.toThrow()
    await expect(client.get(ITEM, item(2))).rejects.toThrow()
    expect(renew).toHaveBeenCalledTimes(2)
  })

  it('never renews for auth calls', async () => {
    const { renew, client } = setup()

    await expect(client.post('/admin/auth/logout', { auth: false })).rejects.toMatchObject({ kind: 'unauthorized', silent: false })
    expect(renew).not.toHaveBeenCalled()
  })
})

/**
 * The part of the Web Locks API that `acrossTabs` uses, so the test doesn't depend on the Node
 * version (Node 22 has no `navigator.locks`). One holder per name; `ifAvailable` gets `null`.
 */
function fakeLocks() {
  const held = new Set<string>()
  const waiting = new Map<string, Array<() => void>>()
  type Callback = (lock: { name: string } | null) => unknown

  async function request(name: string, optionsOrCallback: { ifAvailable?: boolean } | Callback, maybeCallback?: Callback) {
    const options = typeof optionsOrCallback === 'function' ? {} : optionsOrCallback
    const callback = (typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback)!
    if (held.has(name)) {
      if (options.ifAvailable) return callback(null)
      await new Promise<void>(resolve => waiting.set(name, [...(waiting.get(name) ?? []), resolve]))
    }
    held.add(name)
    try {
      return await callback({ name })
    }
    finally {
      held.delete(name)
      waiting.get(name)?.shift()?.()
    }
  }
  return { request }
}

describe('acrossTabs', () => {
  it('renews in one tab while the other waits for it', async () => {
    vi.stubGlobal('navigator', { locks: fakeLocks() })
    try {
      const gate = deferred()
      const renew = vi.fn(() => gate.promise)
      let secondDone = false

      const first = acrossTabs('test:renew', renew)
      const second = acrossTabs('test:renew', renew).then(() => {
        secondDone = true
      })
      await vi.waitFor(() => expect(renew).toHaveBeenCalledOnce())
      await Promise.resolve()
      // The second tab waits for the first tab's renewal instead of starting its own.
      expect(secondDone).toBe(false)
      gate.resolve(undefined)

      await Promise.all([first, second])
      expect(renew).toHaveBeenCalledOnce()
    }
    finally {
      vi.unstubAllGlobals()
    }
  })

  it('renews directly without the Web Locks API', async () => {
    vi.stubGlobal('navigator', {})
    try {
      const renew = vi.fn(async () => 'renewed')
      expect(await acrossTabs('test:none', renew)).toBe('renewed')
    }
    finally {
      vi.unstubAllGlobals()
    }
  })
})
