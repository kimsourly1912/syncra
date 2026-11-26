import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { clearNuxtState, useNuxtApp, useRouter } from '#imports'
import { redirectTarget, useSession } from '..'
import { fakeApi, httpError, ok } from '#test/fake-api'

const { navigate, toast } = vi.hoisted(() => ({
  navigate: vi.fn((to: unknown) => to),
  toast: { add: vi.fn() },
}))

mockNuxtImport('navigateTo', () => navigate)
mockNuxtImport('useToast', () => () => toast)

const ME = 'GET /admin/users/me/profile'
const profile = ok({ id: 7, username: 'sample-staff' })
const router = { push: vi.fn() }

beforeEach(async () => {
  vi.clearAllMocks()
  router.push = vi.spyOn(useRouter(), 'push').mockResolvedValue(undefined)
  await useSession().load()
  clearNuxtState(['session:status', 'session:staff'])
})

describe('session', () => {
  it('loads the profile once for concurrent callers', async () => {
    const { transport } = fakeApi({ [ME]: profile })
    const session = useSession()

    await Promise.all([session.load(), session.load(), useSession().load()])

    expect(transport).toHaveBeenCalledOnce()
    expect(session.status.value).toBe('signed-in')
  })

  it('is signed out when the profile request is refused', async () => {
    fakeApi({
      [ME]: () => {
        throw httpError(401)
      },
    })

    await useSession().load()
    expect(useSession().status.value).toBe('signed-out')
  })

  it('ends an expired session once, with a toast and a way back', async () => {
    fakeApi({ [ME]: profile })
    const session = useSession()
    await session.load()

    session.end('expired')
    session.end('expired')

    expect(session.status.value).toBe('signed-out')
    expect(toast.add).toHaveBeenCalledOnce()
    expect(router.push).toHaveBeenCalledOnce()
    expect(router.push).toHaveBeenCalledWith({ path: '/auth/sign-in', query: { redirect: useRouter().currentRoute.value.fullPath } })
  })

  it('keeps the session unknown when the API can\'t answer, and tries again on the next load', async () => {
    const { transport } = fakeApi({
      [ME]: () => {
        throw httpError(502)
      },
    })
    const session = useSession()

    expect(await session.load()).toMatchObject({ kind: 'server' })
    expect(session.status.value).toBe('unknown')

    fakeApi({ [ME]: profile })
    expect(await session.load()).toBeUndefined()
    expect(session.status.value).toBe('signed-in')
    expect(transport).toHaveBeenCalledOnce()
  })

  it.each([401, 403])('is signed out when the profile request answers %i', async (status) => {
    fakeApi({
      [ME]: () => {
        throw httpError(status)
      },
    })

    await useSession().load()
    expect(useSession().status.value).toBe('signed-out')
  })

  it('stays signed in when a reload fails for the connection', async () => {
    fakeApi({ [ME]: profile })
    const session = useSession()
    await session.load()

    fakeApi({
      [ME]: () => {
        throw Object.assign(new Error('offline'), { name: 'FetchError', cause: new TypeError('Failed to fetch') })
      },
    })

    expect(await session.reload()).toMatchObject({ kind: 'network' })
    expect(session.status.value).toBe('signed-in')
    expect(session.staff.value).toMatchObject({ id: 7 })
  })

  it('ignores a profile that arrives after another tab signed out', async () => {
    let answer!: (value: unknown) => void
    fakeApi({ [ME]: () => new Promise((resolve) => {
      answer = resolve
    }) })
    const session = useSession()

    const loading = session.load()
    await vi.waitFor(() => expect(answer).toBeTypeOf('function'))
    session.end('signed-out-elsewhere')
    answer(profile)
    await loading

    expect(session.status.value).toBe('signed-out')
    expect(session.staff.value).toBeNull()
  })

  it('forgets the loaded data once the expired session has left the page', async () => {
    fakeApi({ [ME]: profile })
    const session = useSession()
    await session.load()
    useNuxtApp().payload.data['sample:item'] = { id: 1 }

    session.end('expired')
    await flushPromises()

    expect(useNuxtApp().payload.data['sample:item']).toBeUndefined()
  })

  it('doesn\'t navigate when the session ends before the first load finished', () => {
    useSession().end('expired')

    expect(router.push).not.toHaveBeenCalled()
    expect(toast.add).not.toHaveBeenCalled()
  })
})

describe('redirectTarget', () => {
  it.each([
    ['/techpack-reviews/101?tab=pdf', '/techpack-reviews/101?tab=pdf'],
    ['//evil.example', '/'],
    ['/\\evil.example', '/'],
    ['https://evil.example', '/'],
    ['/auth/sign-in', '/'],
    [undefined, '/'],
    [['/a', '/b'], '/'],
  ])('%s → %s', (value, expected) => {
    expect(redirectTarget(value)).toBe(expected)
  })
})
