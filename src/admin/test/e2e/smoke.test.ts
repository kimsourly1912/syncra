import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'
import type { Page, Route } from 'playwright-core'

// Builds the real app and drives it in Chromium. The API is never reached: the build points at
// `api.test.invalid`, and every request to it is answered here. A request no test expected fails
// the test, so a new call the screens make shows up as a failure, not a hang.
const API = 'http://api.test.invalid'
process.env.NUXT_PUBLIC_API_URL = API

const ok = (data: unknown = null) => ({ success: true, msg: 'ok', reason: null, data })
const page = (items: unknown[], totalPages = 1) => ({ page: 0, size: 20, totalItems: items.length, totalPages, items })

// Sanitized fixtures shaped like the API responses.
const staff = { id: 1, username: 'sample-staff', email: 'staff@example.test' }
const lead = { id: 7, inquiryCode: 'L-0007', fullName: 'Test Lead', companyName: 'Example Co', workEmail: 'lead@example.test', status: 'NEW' }
const review = { fileId: 101, jobId: 202, companyId: 303, filename: 'sample-techpack.pdf', draftUuid: '00000000-0000-4000-8000-000000000001', status: 'IN_REVIEW' }

type Answer = { status?: number, body?: unknown }
type Answers = Record<string, Answer | (() => Answer)>

/** Answers `METHOD /path` requests to the fake API (query strings ignored), CORS included. */
async function fakeApi(browserPage: Page, answers: Answers) {
  const unexpected: string[] = []
  const requests: string[] = []
  await browserPage.route(`${API}/**`, async (route: Route) => {
    const request = route.request()
    const origin = (await request.headerValue('origin')) ?? '*'
    const cors = {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE',
    }
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })

    const key = `${request.method()} ${new URL(request.url()).pathname}`
    requests.push(key)
    const answer = answers[key]
    if (!answer) {
      unexpected.push(key)
      return route.fulfill({ status: 500, headers: cors, json: { reason: `Unexpected request: ${key}` } })
    }
    const { status = 200, body = ok() } = typeof answer === 'function' ? answer() : answer
    return route.fulfill({ status, headers: cors, json: body })
  })
  return { unexpected, requests }
}

describe('admin smoke', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    browser: true,
    // The first build of the app takes a while, longer on a cold Windows machine.
    setupTimeout: 300_000,
  })

  it('sends a signed-out deep link to sign-in, signs in, and lands on the link', async () => {
    let signedIn = false
    const browserPage = await createPage()
    const api = await fakeApi(browserPage, {
      'GET /admin/users/me/profile': () => (signedIn ? { body: ok(staff) } : { status: 401, body: { reason: 'Unauthorized' } }),
      'POST /admin/auth/refresh': { status: 401, body: { reason: 'Unauthorized' } },
      'POST /admin/auth/login': () => {
        signedIn = true
        return { body: ok() }
      },
      'GET /admin/lead-inquiries': { body: page([lead]) },
      'GET /admin/lead-inquiries/summary': { body: { leadReceived: 1 } },
    })

    await browserPage.goto(url('/lead-inquiry'), { waitUntil: 'networkidle' })
    // vue-router may leave the `/` in the query unencoded.
    await browserPage.waitForURL(/\/auth\/sign-in\?redirect=(%2F|\/)lead-inquiry$/, { waitUntil: 'commit' })
    expect(await browserPage.title()).toBe('Sign in · Syncra Admin')

    await browserPage.getByLabel('Email').fill('staff@example.test')
    await browserPage.getByLabel('Password', { exact: true }).fill('sample-password')
    await browserPage.getByRole('button', { name: 'Sign in' }).click()

    await browserPage.waitForURL(/\/lead-inquiry$/, { waitUntil: 'commit' })
    await browserPage.getByText('Test Lead').first().waitFor()
    expect(await browserPage.title()).toBe('Lead Inquiries · Syncra Admin')
    expect(api.requests).toContain('POST /admin/auth/login')
    expect(api.unexpected).toEqual([])
    await browserPage.close()
  })

  it('opens the TechPack review queue for a signed-in staff member', async () => {
    const browserPage = await createPage()
    const api = await fakeApi(browserPage, {
      'GET /admin/users/me/profile': { body: ok(staff) },
      'GET /admin/docai/techpack-reviews': { body: ok({ content: [review], totalPages: 1, totalElements: 1 }) },
    })

    await browserPage.goto(url('/techpack-reviews'), { waitUntil: 'networkidle' })
    await browserPage.getByText('sample-techpack.pdf').first().waitFor()
    expect(await browserPage.title()).toBe('TechPack Reviews · Syncra Admin')
    expect(api.unexpected).toEqual([])
    await browserPage.close()
  })
})
