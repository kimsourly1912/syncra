# Admin data access

How Admin reads and writes API data and keeps the staff session. The reasoning: [0007](../../../docs/decisions/0007-generated-api-contract.md) (generated contract and models), [0008](../../../docs/decisions/0008-admin-api-client-and-session.md) (client, errors, session), [0009](../../../docs/decisions/0009-admin-typed-endpoints-and-query-toolkit.md) (typed endpoints, no services, query and mutation helpers), [0014](../../../docs/decisions/0014-admin-session-survives-api-outages.md) (session through outages).

## The flow

```text
pages/<route>.vue                  thin: definePageMeta + <Screen />
  → features/<f>/components/       render state, call actions
  → features/<f>/composables/      useApiQuery (reads), useApiMutation (writes), feature state
  → api.get/post/… (@/api)         path, query, and body checked against the spec at compile time
  → client                         envelope, model parsing, ApiError, session renewal
```

There is no service layer: a composable calls `api` inside `useApiQuery` or `useApiMutation` and passes the feature's model.

## Calling the API

```ts
import { api } from '@/api'

api.get('/admin/docai/techpack-reviews/{fileId}', { path: { fileId }, signal, model: reviewItemModel })
api.post('/admin/docai/techpack-reviews/{fileId}/approve', { path: { fileId }, body: { draftUuid, sourceVerified: true } })
api.post('/admin/docai/techpack-reviews/{fileId}/draft', { path: { fileId }, query: { draftUuid }, body: { workbook } }) // multipart
api.download('/admin/docai/techpack-reviews/{fileId}/source', { path: { fileId } })                                    // Blob
```

- **Paths are the spec's**, `{param}` placeholders included. A wrong method, path, path param, or query or body field is a compile error. Never build a path by hand.
- **The generated endpoint map decides the transport:** `MULTIPART_ENDPOINTS` send a plain object body as `FormData`, and `UNENVELOPED_ENDPOINTS` (no `success` flag in the spec: `lead-inquiries/*`, `sale-requests/*`, `sns/*`) are read without unwrapping. Don't pass `envelope` unless the spec is known to be wrong, with a comment saying so.
- `model` is what the feature needs from the response ([the API contract](#the-api-contract)). Without one, the call resolves to `undefined`.
- `auth: false` only for calls that set or renew session cookies (sign-in, password reset, refresh): their 401 is thrown as is.
- `api` needs no Nuxt context, so it works after an `await`. Nothing is retried, except once after a renewed session.
- In `nuxt dev`, requests go to `/_api`, which Nitro's `devProxy` forwards to `NUXT_PUBLIC_API_URL`, because the API's CORS and cookies don't accept localhost.

## Reads: `useApiQuery`

```ts
const review = useApiQuery(
  () => `techpack-review:item:${fileId.value}`,
  ({ signal }) => api.get('/admin/docai/techpack-reviews/{fileId}', { path: { fileId: fileId.value }, signal, model: reviewItemModel }),
  { enabled: () => fileId.value > 0 },
)
review.data / review.error / review.refresh()
review.loading     // nothing to show for this key: the first load, or a new key
review.refreshing  // reloading the same key with its data shown
```

- **The key is `'<feature>:<name>:<inputs…>'`**, `<feature>` being the folder under `features/` (`lead-inquiry:list:…`, not the API's `lead-inquiries`), so `invalidate: ['lead-inquiry']` finds it. Keys and `invalidate` are typed (`QueryKey`, `QueryFeature`): a feature not in `QUERY_FEATURES` (`composables/useApiQuery.ts`) fails typecheck, so add a feature there with its first query. Put every input the request uses into the key, with a getter when they change. In dev, `invalidateQueries` warns about a prefix no query has used.
- A new key is `loading` with `data` undefined, so a filter or page change shows `ListSkeleton`, never another query's rows. Only a reload of the same key is `refreshing`.
- Pass `signal` through: a newer load cancels the older one. `enabled` holds the load until its inputs exist.
- Components using the same key share one request.
- **When a reload fails for the connection or the server, the last good data stays on screen** (a refusal clears it). That data is for display only: a decision such as an approval gate reads it only while `error` is unset (`useDraftInspection().current`).
- Inline errors use `errorMessage(error, 'Could not load …')`: the API's reason, or the fallback.

## Writes: `useApiMutation`

```ts
const approve = useApiMutation(
  (draft: ReviewDraft) => api.post('/admin/docai/techpack-reviews/{fileId}/approve', { path: { fileId: draft.fileId }, body: { draftUuid: draft.draftUuid, sourceVerified: true } }),
  { success: 'Workbook reviewed and released.', error: 'Could not approve the workbook', invalidate: ['techpack-review'] },
)
const result = await approve.execute(draft) // { ok: true, data } | { ok: false, error }; never throws
if (result.ok) await router.replace('/techpack-reviews?status=reviewed')
```

- **No `try`/`catch` in features** (lint enforces it). The helper toasts `success`, or `error` with the API's message; silent errors (cancelled, session ended) show nothing.
- `pending` is true while a call runs, and a second `execute` meanwhile is skipped, so a double click sends once.
- `invalidate` refreshes the on-screen queries whose key starts with a prefix; `invalidateQueries(...)` does it by hand.
- Navigate with a router captured in setup, not `navigateTo` (lint enforces it): the code runs after an `await`.
- `useAppToast().failed(text)` reports a failure the composable decides itself.
- `error: false` skips the failure toast, for a form that shows the returned `error` inline (the auth pages, [forms](forms.md#rules)).
- Destructive actions ask first with `<ModalConfirm>`.

## Lists: `useListQuery`

The URL is the list's state (`/lead-inquiry?status=new&search=acme&page=2&size=50`), so reload, Back, and shared links keep the place ([0011](../../../docs/decisions/0011-admin-list-toolkit-and-color-mode.md)). The composable's JSDoc lists every member; the rules:

```ts
const list = useListQuery({ status: ['all', 'new'] as const }, { search: true, pageSizes: [20, 50, 100] })
list.filters.value.status / list.search.value / list.page.value / list.pageSize.value
list.setFilters({ status: 'new' }) / list.setSearch('acme') / list.setPage(2) / list.setPageSize(50) / list.clearFilters()
list.keepPageInRange(() => query.data.value?.totalPages)
```

- A filter's first choice is its default and stays out of the URL; an unknown value reads as the default.
- Filter, page, and size changes add history entries; a search replaces the current one. Each goes back to page 1, and a filter change also closes a `useUrlRecord` panel.
- `page` is 1-based; the Admin API's is **zero-based**: send `page - 1`, and `pageSize` as `size`.
- Turn on `search` and `pageSizes` only when the endpoint takes `search` and `size` (lead inquiries, portal users, sale requests; not TechPack reviews). `sort` isn't used: its format isn't confirmed ([open questions](../../../docs/product/open-questions.md#admin)).
- Links into a record pass the list's query along, so its Back link returns to the same tab and page.

## Errors

Every failure is one `ApiError` (inside the helpers, `error` or `result.error`):

| `kind` | When | `message` |
| --- | --- | --- |
| `rejected` | `success: false` (any status but 401, 403, and 429), or another 4xx | The API's `reason` |
| `validation`, `not_found`, `conflict`, `forbidden` | 400/422, 404, 409, 403 | The API's `reason` |
| `unauthorized` | A 401 that couldn't be recovered | "Your session has expired…" |
| `contract` | The response doesn't match the `model` | `Unexpected response from GET /admin/… (field: issue)` |
| `server`, `network`, `timeout`, `rate_limited`, `aborted`, `unknown` | 5xx without an envelope, no response, timeout, 429 (with or without an envelope), cancelled, other | A fixed, user-safe message |

`retryable` is true for `network`, `timeout`, `server`, and `rate_limited`, so a rate-limited session renewal keeps the session; `silent` for cancelled requests and the 401 that ended the session. `ApiError.from(e)` unwraps one from inside other errors.

**Reporting.** `contract` and `unknown` errors shown by a toast, a failed profile load, and errors nothing caught (`plugins/report-errors.client.ts`) go to `reportAppError` (`utils/report.ts`). It logs to the console until a reporting service is chosen ([open questions](../../../docs/product/open-questions.md#admin)); connect one with `setErrorReporter`. Call `reportAppError` yourself only for a failure the team must see that none of these cover; never `console.error`.

## The API contract

The spec snapshot is `openapi/syncra.json`. `pnpm --filter admin api:pull` refreshes it (from `NUXT_PUBLIC_API_URL` in `.env`), and `pnpm --filter admin api:gen` regenerates `app/api/generated/`: `Api.*` types, `v*` Valibot schemas, and the endpoint map, for `/admin/**` only. Never edit the generated files. After a spec change, run both and commit the spec with the output; a removed or changed endpoint then fails typecheck where it's called.

**Every generated field is optional and nullable**, because the spec doesn't say otherwise. Don't hide that with `!`, `?? 0`, or defaults: declare what the feature needs in a model in `features/<f>/models/`:

```ts
export const reviewItemModel = defineModel(vReviewItem, {
  required: ['fileId', 'jobId', 'companyId', 'filename', 'status'], // present and not null
  optional: ['draftUuid', 'reviewedAt'],                            // may be null or missing
})
export type ReviewItem = v.InferOutput<typeof reviewItemModel>
```

A list is parsed whole (`v.object({ content: v.array(reviewItemModel), totalPages: v.number() })`): one bad row fails the request, and rows are never dropped silently. Request bodies are typed by the endpoint map; a form keeps its own schema and maps its values to the body.

## The session

`features/session` owns who is signed in. It is navigation state only: the API checks the session on every request, and there is no staff role map.

| `useSession()` | Does |
| --- | --- |
| `status`, `staff`, `signedIn` | `'unknown' \| 'signed-in' \| 'signed-out'`, the `StaffProfile`, and a computed, all read-only |
| `load()` | Loads the profile once, shared by concurrent callers; the route guard calls it until the status is known. A refusal means signed out. If the API can't answer, it resolves to the `ApiError` and the status stays `unknown`. |
| `reload()` | Loads the profile again after the cookies changed (password reset, another tab, a profile edit) |
| `signIn(body)` / `signOut()` | Log in or out and tell the other tabs. `signOut` renews an expired access token first, and keeps the session if the API can't be reached. |
| `end(reason)` | Ends the session locally (`'expired'` or `'signed-out-elsewhere'`), goes to sign-in, and clears every query's data. Idempotent. |

`features/auth` wraps these for the forms (`useSignIn`, `useSignOut`, `useForgotPassword`, `useResetPassword`).

**Renewal.** On a 401 the client renews the session once (`POST /admin/auth/refresh`) and retries the request; concurrent 401s and other tabs share one renewal (`api/recovery.ts`). A refused renewal ends the session; a transient failure is thrown and the session stays. **If you add `useState` that belongs to the signed-in staff member, clear it in `useSession`'s `clear()`.**
