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

/**
 * A fake API that answers 401 until `session.valid` is true. `renew` is what the test passes;
 * by default it makes the session valid.
 */
function setup(renew?: () => Promise<unknown>) {
  const session = { valid: false }
  const transport = vi.fn(async (endpoint: string) => {
    if (!session.valid) throw httpError(401)
    return ok({ id: Number(endpoint.split('/').pop()) })
  })
  const onExpired = vi.fn()
  const renewSpy = vi.fn(renew ?? (async () => {
    session.valid = true
  }))
  const client = createApiClient({ fetch: transport as unknown as $Fetch, renew: renewSpy, onExpired })
  return { session, transport, renew: renewSpy, onExpired, client }
}

describe('responses', () => {
  it('returns the parsed model from a success envelope', async () => {
    const { session, client, transport } = setup()
    session.valid = true

    expect(await client.get('items/7', { model: itemModel, query: { page: 0 } })).toEqual({ id: 7 })
    expect(transport).toHaveBeenCalledWith('items/7', expect.objectContaining({ method: 'GET', query: { page: 0 } }))
  })

  it('resolves to nothing without a model', async () => {
    const { session, client } = setup()
    session.valid = true

    expect(await client.post('items/7', { body: { a: 1 } })).toBeUndefined()
  })

  it('throws a rejected ApiError with the reason for a success: false envelope', async () => {
    const transport = vi.fn(async () => ({ success: false, msg: 'SC0001', reason: 'Review not found', data: null }))
    const client = createApiClient({ fetch: transport as unknown as $Fetch, renew: vi.fn(), onExpired: vi.fn() })

    const error = await client.get('items/7', { model: itemModel }).catch(e => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'rejected', reason: 'Review not found', code: 'SC0001', message: 'Review not found', source: 'GET items/7' })
  })

  it('throws a contract ApiError naming the endpoint and field', async () => {
    const transport = vi.fn(async () => ok({ id: null }))
    const client = createApiClient({ fetch: transport as unknown as $Fetch, renew: vi.fn(), onExpired: vi.fn() })

    await expect(client.get('items/7', { model: itemModel })).rejects.toMatchObject({
      kind: 'contract',
      message: expect.stringMatching(/^Unexpected response from GET items\/7 \(id: /),
    })
  })

  it('parses a body without an envelope when asked', async () => {
    const transport = vi.fn(async () => ({ id: 3 }))
    const client = createApiClient({ fetch: transport as unknown as $Fetch, renew: vi.fn(), onExpired: vi.fn() })

    expect(await client.get('items/3', { model: itemModel, envelope: false })).toEqual({ id: 3 })
  })

  it('downloads a blob without parsing it', async () => {
    const blob = new Blob(['x'])
    const transport = vi.fn(async () => blob)
    const client = createApiClient({ fetch: transport as unknown as $Fetch, renew: vi.fn(), onExpired: vi.fn() })

    expect(await client.download('files/1')).toBe(blob)
    expect(transport).toHaveBeenCalledWith('files/1', expect.objectContaining({ method: 'GET', responseType: 'blob' }))
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

  it('shows the server reason only for user-facing kinds', () => {
    expect(ApiError.from(httpError(409, { reason: 'Draft changed' })).message).toBe('Draft changed')
    expect(ApiError.from(httpError(500, { detail: 'NullPointerException' })).message).toBe('Something went wrong on the server. Please try again.')
  })

  it('keeps cancelled requests silent', () => {
    expect(ApiError.from(noResponse('AbortError')).silent).toBe(true)
    expect(ApiError.from(httpError(500)).silent).toBe(false)
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

    await expect(client.get('items/1')).rejects.toMatchObject({ kind: 'server' })
    expect(renew).not.toHaveBeenCalled()
  })

  it('shares one renewal between concurrent 401s and retries each request', async () => {
    const gate = deferred()
    const { session, transport, renew, onExpired, client } = setup(async () => {
      await gate.promise
      session.valid = true
    })

    const requests = Promise.all([1, 2, 3].map(id => client.get(`items/${id}`, { model: itemModel })))
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

    const slow = client.get('items/9', { model: itemModel })
    await client.get('items/1', { model: itemModel })
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

    const error = await client.get('items/1').catch(e => e)
    expect(error).toMatchObject({ kind: 'unauthorized', silent: true })
    expect(transport).toHaveBeenCalledOnce()
    expect(onExpired).toHaveBeenCalledOnce()
  })

  it('keeps the session when the renewal fails for a transient reason', async () => {
    const { onExpired, client } = setup(() => Promise.reject(noResponse('TypeError')))

    await expect(client.get('items/1')).rejects.toMatchObject({ kind: 'network', silent: false })
    expect(onExpired).not.toHaveBeenCalled()
  })

  it('retries only once, and ends the session if the retry is refused too', async () => {
    const { transport, onExpired, client } = setup(async () => {})

    await expect(client.get('items/1')).rejects.toMatchObject({ kind: 'unauthorized', silent: true })
    expect(transport).toHaveBeenCalledTimes(2)
    expect(onExpired).toHaveBeenCalledOnce()
  })

  it('starts a new renewal after the previous one settled', async () => {
    const { renew, client } = setup(() => Promise.reject(httpError(401)))

    await expect(client.get('items/1')).rejects.toThrow()
    await expect(client.get('items/2')).rejects.toThrow()
    expect(renew).toHaveBeenCalledTimes(2)
  })

  it('never renews for auth calls', async () => {
    const { renew, client } = setup()

    await expect(client.post('auth/login', { auth: false })).rejects.toMatchObject({ kind: 'unauthorized', silent: false })
    expect(renew).not.toHaveBeenCalled()
  })
})

describe('acrossTabs', () => {
  it('renews in one tab while the other waits for it', async () => {
    const gate = deferred()
    const renew = vi.fn(() => gate.promise)

    const first = acrossTabs('test:renew', renew)
    const second = acrossTabs('test:renew', renew)
    await vi.waitFor(() => expect(renew).toHaveBeenCalledOnce())
    gate.resolve(undefined)

    await Promise.all([first, second])
    expect(renew).toHaveBeenCalledOnce()
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
