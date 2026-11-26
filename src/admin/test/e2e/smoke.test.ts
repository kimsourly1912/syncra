import { readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import AxeBuilder from '@axe-core/playwright'
import { createPage, getBrowser, setup, url } from '@nuxt/test-utils/e2e'
import type { Page, Route } from 'playwright-core'
import type { Api } from '@/api'
import { listPage, ok } from '../support/responses'

// Builds the real app and drives it in Chromium. The API is never reached: the build points at
// `api.test.invalid`, and every request to it is answered here. A request no test expected fails
// the test, so a new call the screens make shows up as a failure, not a hang.
const API = 'http://api.test.invalid'
process.env.NUXT_PUBLIC_API_URL = API

// Sanitized fixtures shaped like the API responses.
const staff = { id: 1, username: 'sample-staff', email: 'staff@example.test' } satisfies Api.SyncraAdminProfileResponse
const lead = { id: 7, inquiryCode: 'L-0007', fullName: 'Test Lead', companyName: 'Example Co', workEmail: 'lead@example.test', status: 'NEW' } satisfies Api.ContactSaleInquiryResponse
const review = { fileId: 101, jobId: 202, companyId: 303, filename: 'sample-techpack.pdf', draftUuid: '00000000-0000-4000-8000-000000000001', status: 'IN_REVIEW' } satisfies Api.ReviewItem

/** The axe rules the sweep runs: WCAG 2.1, levels A and AA. */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const PAGES_DIR = fileURLToPath(new URL('../../app/pages', import.meta.url))

/** The staff pages' paths, from the files in app/pages: no route params, no guest (auth) pages. */
function staffPages(dir = PAGES_DIR): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return entry.name === 'auth' ? [] : staffPages(join(dir, entry.name))
    if (!entry.name.endsWith('.vue') || entry.name.includes('[')) return []
    const path = relative(PAGES_DIR, join(dir, entry.name)).split(sep).join('/').replace(/(^|\/)?index\.vue$|\.vue$/, '')
    return [`/${path}`]
  })
}

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
      'GET /admin/lead-inquiries': { body: listPage([lead]) },
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
    expect(await browserPage.title()).toBe('Lead inquiries · Syncra Admin')
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
    expect(await browserPage.title()).toBe('TechPack reviews · Syncra Admin')
    // Staff only: kept out of search results.
    expect(await browserPage.locator('meta[name="robots"]').getAttribute('content')).toBe('noindex, nofollow')
    expect(api.unexpected).toEqual([])
    await browserPage.close()
  })

  // Every page without a route param, found from app/pages so a new page is covered by itself.
  // Signed in, with the list endpoints answered. Each must load without a script error, an error
  // the app logged, or a request no one expected, and its tab must read "<navbar title> · Syncra
  // Admin", the one check that the screen's navbar repeats the page's `definePageMeta` title.
  it('loads every page, with a tab title that matches its navbar', async () => {
    // Its own context: axe needs a page opened through browser.newContext().
    const context = await (await getBrowser()).newContext()
    const browserPage = await context.newPage()
    const api = await fakeApi(browserPage, {
      'GET /admin/users/me/profile': { body: ok(staff) },
      'GET /admin/portal-users': { body: ok(listPage([])) },
      'GET /admin/portal-users/summary': { body: ok({}) },
      'GET /admin/lead-inquiries': { body: listPage([lead]) },
      'GET /admin/lead-inquiries/summary': { body: {} },
      'GET /admin/sale-requests': { body: listPage([]) },
      'GET /admin/sale-requests/dashboard': { body: {} },
      'GET /admin/docai/techpack-reviews': { body: ok({ content: [review], totalPages: 1, totalElements: 1 }) },
    })
    const errors: string[] = []
    browserPage.on('pageerror', error => errors.push(`script error: ${error.message}`))
    browserPage.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
    })

    const failures: string[] = []
    // Every page in light, then in dark: contrast that passes on white can fail on the dark
    // background. Dark is the stored choice staff make with the color mode button.
    for (const mode of ['light', 'dark'] as const) {
      if (mode === 'dark') await browserPage.evaluate(() => localStorage.setItem('nuxt-color-mode', 'dark'))
      for (const path of staffPages()) {
        const where = `${path} (${mode})`
        errors.length = 0
        await browserPage.goto(url(path), { waitUntil: 'networkidle' })
        const navbar = browserPage.locator('h1[data-slot="title"]').first()
        await navbar.waitFor()
        const dark = await browserPage.evaluate(() => document.documentElement.classList.contains('dark'))
        if (dark !== (mode === 'dark')) failures.push(`${where}: not in ${mode} mode`)
        const expected = `${(await navbar.textContent())?.trim()} · Syncra Admin`
        const title = await browserPage.title()
        if (title !== expected) failures.push(`${where}: tab "${title}", expected "${expected}"`)
        failures.push(...errors.map(error => `${where}: ${error}`))
        // A response that broke its model shows inline and logs nothing, so look for it on screen.
        if (await browserPage.getByText(/unexpected response/i).count()) failures.push(`${where}: shows an unexpected-response error`)
        // What axe can check automatically against WCAG 2.1 A and AA (labels, names, contrast,
        // landmarks). Keyboard and focus order still need a person (docs/testing.md).
        const { violations } = await new AxeBuilder({ page: browserPage }).withTags(WCAG).analyze()
        failures.push(...violations.map(v => `${where}: a11y ${v.id} (${v.impact}): ${v.help} — ${v.nodes.map(node => node.target.join(' ')).slice(0, 3).join(', ')}`))
      }
    }

    expect(failures).toEqual([])
    expect(api.unexpected).toEqual([])
    await context.close()
  })
})
