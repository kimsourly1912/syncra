import type { RouteLocationNormalized } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtState, useRouter } from '#imports'
import accessGuard from '@/middleware/access.global'
import { useSession } from '@/features/session'
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

function to(fullPath: string, meta: Record<string, unknown> = {}, query: Record<string, string> = {}) {
  return { fullPath, path: fullPath.split('?')[0], meta, query } as unknown as RouteLocationNormalized
}

beforeEach(async () => {
  vi.clearAllMocks()
  router.push = vi.spyOn(useRouter(), 'push').mockResolvedValue(undefined)
  await useSession().load()
  clearNuxtState(['session:status', 'session:staff'])
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

  it('shows the error page, not sign-in, when the API can\'t answer', async () => {
    fakeApi({ [ME]: () => Promise.reject(httpError(503)) })

    const result = await accessGuard(to('/techpack-reviews?status=reviewed'), to('/'))

    expect(result).toMatchObject({ status: 503, fatal: true, data: { retry: '/techpack-reviews?status=reviewed' } })
    expect(navigate).not.toHaveBeenCalled()
  })

  it('lets a signed-out visitor open the guest pages', async () => {
    fakeApi({ [ME]: () => Promise.reject(httpError(401)) })

    expect(await accessGuard(to('/auth/sign-in', { access: 'guest' }), to('/'))).toBeUndefined()
    expect(navigate).not.toHaveBeenCalled()
  })
})
