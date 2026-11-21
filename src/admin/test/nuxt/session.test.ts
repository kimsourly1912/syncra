import type { RouteLocationNormalized } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtState, useRouter } from '#imports'
import accessGuard from '../../app/middleware/access.global'
import { redirectTarget, useSession } from '../../app/features/session'
import { fakeApi, httpError, ok } from '../fake-api'

const { navigate, toast } = vi.hoisted(() => ({
  navigate: vi.fn((to: unknown) => to),
  toast: { add: vi.fn() },
}))

mockNuxtImport('navigateTo', () => navigate)
mockNuxtImport('useToast', () => () => toast)

const ME = 'GET /admin/users/me/profile'
const profile = ok({ id: 7, username: 'sample-staff' })
const router = { push: vi.fn() }

function to(fullPath: string, meta: Record<string, unknown> = {}, query: Record<string, string> = {}) {
  return { fullPath, path: fullPath.split('?')[0], meta, query } as unknown as RouteLocationNormalized
}

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

  it('doesn\'t navigate when the session ends before the first load finished', () => {
    useSession().end('expired')

    expect(router.push).not.toHaveBeenCalled()
    expect(toast.add).not.toHaveBeenCalled()
  })
})

describe('access guard', () => {
  it('sends a signed-out visitor to sign-in, remembering the page', async () => {
    fakeApi({ [ME]: () => Promise.reject(httpError(401)) })

    await accessGuard(to('/techpack-reviews?status=reviewed'), to('/'))

    expect(navigate).toHaveBeenCalledWith({ path: '/auth/sign-in', query: { redirect: '/techpack-reviews?status=reviewed' } })
  })

  it('doesn\'t add a redirect for the home page', async () => {
    fakeApi({ [ME]: () => Promise.reject(httpError(401)) })

    await accessGuard(to('/'), to('/'))

    expect(navigate).toHaveBeenCalledWith({ path: '/auth/sign-in', query: {} })
  })

  it('lets staff through, and keeps them off the guest pages', async () => {
    fakeApi({ [ME]: profile })

    expect(await accessGuard(to('/techpack-reviews'), to('/'))).toBeUndefined()
    await accessGuard(to('/auth/sign-in', { access: 'guest' }, { redirect: '/product' }), to('/'))

    expect(navigate).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledWith('/product')
  })

  it('lets a signed-out visitor open the guest pages', async () => {
    fakeApi({ [ME]: () => Promise.reject(httpError(401)) })

    expect(await accessGuard(to('/auth/sign-in', { access: 'guest' }), to('/'))).toBeUndefined()
    expect(navigate).not.toHaveBeenCalled()
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
