# Portal testing

Portal uses Vitest with `@nuxt/test-utils`. Projects are defined in `vitest.config.ts`.

| Project | Folder | Environment | Use for |
| --- | --- | --- | --- |
| `unit` | `test/unit/**/*.test.ts` | `node` | Pure helpers, schema mapping, status logic |
| `nuxt` | `test/nuxt/**/*.test.ts` | `nuxt` (happy-dom) | Composables, stores, and components that need the Nuxt app, auto-imports, or rendering |
| `integration`, `e2e` | `test/integration`, `test/e2e` | `node` | Configured, but empty. Don't add tests here until a running-service setup exists. |

## Commands

Run from the repository root:

```bash
pnpm --filter @syncra/portal test:unit --run
```

```bash
pnpm --filter @syncra/portal test:nuxt --run
```

```bash
pnpm --filter @syncra/portal test:nuxt --run test/nuxt/invoice-workspace.test.ts
```

```bash
pnpm --filter @syncra/portal lint
```

Without `--run`, Vitest starts in watch mode. Run `pnpm --filter @syncra/portal build` after config or app-wide changes.

## What to test

| Change | Test |
| --- | --- |
| A pure helper, status rule, or form → request mapping | `unit`. Example: `test/unit/glossary.test.ts` for `features/glossary/utils/glossary.ts`. |
| A composable action (both failure paths, refresh after success, pending flags) | `nuxt`, with `useAPI` or the service mocked |
| Discarding stale responses | `nuxt`. Example: `test/nuxt/profile-balance.test.ts`. Finish the requests out of order and check that the newest one wins. |
| Conditional rendering (a button that shows only when allowed) | `nuxt` with `mountSuspended`. Example: `test/nuxt/activity-workbook-download.test.ts`. |
| A Doc AI workflow (Invoice staging, recovery, charges, ERP) | Extend the matching `test/nuxt/*.test.ts`. Don't start a parallel test file. |

A new guard (a company check, a reviewed-file check, a stale-response check) needs a test that fails when you remove the guard.

## Mocking patterns

Tests import app code with **relative paths** (`../../app/...`). The `unit` project resolves only the `@` alias, not `~` ([0004](../../../docs/decisions/0004-import-alias.md)).

**Auto-imported functions** (`useAPI`, `useProfileStore`, `useAppToast`, `useRoute`, `useAsyncData`, `storeToRefs`, `usePermission`) are mocked with `mockNuxtImport`. Shared state goes in `vi.hoisted`:

```ts
import { beforeEach, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const testState = vi.hoisted(() => ({
  api: vi.fn(),
  toast: { add: vi.fn(), addException: vi.fn() },
  profile: { companyId: 42, isAdmin: true },
}))

mockNuxtImport('useAPI', () => testState.api)
mockNuxtImport('useAppToast', () => () => ({ toast: testState.toast }))
mockNuxtImport('useProfileStore', () => () => testState.profile)

beforeEach(() => {
  testState.api.mockReset()
  testState.toast.add.mockReset()
  testState.toast.addException.mockReset()
})

it('reports a resolved failure without showing success', async () => {
  testState.api.mockResolvedValueOnce({ success: false, reason: 'Seat limit reached', data: null, msg: '' })
  // …call the composable action…
  // expect(result).toBe(false)
  // expect(testState.toast.add).toHaveBeenCalledWith('error', expect.objectContaining({ description: 'Seat limit reached' }))
})
```

**Explicitly imported modules** (services, utils) are mocked with `vi.mock` and the same relative path the code under test resolves:

```ts
vi.mock('../../app/services/docai.service', () => ({
  bulkDownloadJobFiles: vi.fn(),
}))
```

**Composables that render** (table cells, for example) are mounted inside a small host component with `mountSuspended`. `activity-workbook-download.test.ts` does this.

**Stores** are created with `useProfileStore(createPinia())`, after mocking `useAPI`, `useAsyncData`, and `useCookie`. `profile-balance.test.ts` does this.

## Fixtures

- Write small inline fixtures with made-up IDs and names (`jobId: 236`, `formattedId: 'PID-0174'`).
- Never use real customer documents, emails, company names, or tokens. For file inputs, build them in memory: `new File(['%PDF-1.4'], 'invoice.pdf', { type: 'application/pdf' })`.
- Cover the failure shapes too: a resolved `{ success: false, reason }`, a thrown `{ data: { title, detail } }`, and a response that arrives after its company changed.

## Known test debt

- `test/unit/sum.test.ts` is a placeholder (`1 + 1 === 2`). Don't copy it.
- There are no tests for team management, settings, or Bookkeeping. Add focused tests when you change those flows.

## Browser verification

Mocked tests prove frontend behavior for their fixtures only. For a changed workflow, also:

- start `pnpm dev:portal` against a test API, with a test company
- go through the normal entry point as each affected role (Admin and Operator)
- check the disabled, error, and retry states as well as the happy path
- report the route, the role, and whether responses were live or mocked

Uploads, confirmations, and anything that spends tokens run only against a test company with sanitized files.
