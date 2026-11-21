# Admin data access

How Admin reads and writes API data and keeps the staff session. The reasoning is in [decision 0009](../../../docs/decisions/0009-admin-typed-endpoints-and-query-toolkit.md) (typed endpoints, no services, query and mutation helpers), [decision 0008](../../../docs/decisions/0008-admin-api-client-and-session.md) (client, errors, session, route access), and [decision 0007](../../../docs/decisions/0007-generated-api-contract.md) (generated contract and models).

## The flow

```text
pages/<route>.vue                  thin: definePageMeta + <Screen />
  → features/<f>/components/       render state, call actions
  → features/<f>/composables/      useApiQuery (reads), useApiMutation (writes), feature state
  → api.get/post/… (@/api)         paths, params, query, and body checked against the spec
  → client                         envelope, model parsing, ApiError, session renewal
```

There is no service layer. A composable calls `api` directly, inside `useApiQuery` or `useApiMutation`, and passes the feature's model.

## Calling the API

```ts
import { api } from '@/api'

api.get('/admin/docai/techpack-reviews', { query: { status, page }, signal, model: reviewPageModel })
api.get('/admin/docai/techpack-reviews/{fileId}', { path: { fileId }, signal, model: reviewItemModel })
api.post('/admin/docai/techpack-reviews/{fileId}/approve', { path: { fileId }, body: { draftUuid, sourceVerified: true } })
api.post('/admin/docai/techpack-reviews/{fileId}/draft', { path: { fileId }, query: { draftUuid }, body: { workbook } })   // multipart
api.download('/admin/docai/techpack-reviews/{fileId}/source', { path: { fileId } })                                      // Blob
```

- **Paths are the spec's paths**, including `{param}` placeholders. `app/api/generated/endpoints.gen.ts` maps every `'METHOD /path'` to its generated request type. A wrong method or path, a missing path param, or a query or body field the spec doesn't have is a **compile error**. Never build paths by hand.
- `path` values are URL-encoded. A missing one throws before anything is sent.
- **Multipart** endpoints (flagged in `MULTIPART_ENDPOINTS`) take a plain object body (`{ workbook }`) and send it as `FormData`.
- `model` is what the feature needs from the response ([the API contract](#the-api-contract)). Without one, the call resolves to `undefined`.
- `envelope: false` is for the few bodies without a `ResponseMsg*` envelope (`sale-requests`, `lead-inquiries`).
- `auth: false` is only for the calls that set or clear session cookies (sign-in, password reset, refresh, logout). A 401 is then thrown as it is, with no renewal.
- `api` needs no Nuxt context, so it works after an `await`. Nothing is retried except one retry after a renewed session.
- `configureApi` (called once by `plugins/session.client.ts`) sets the transport: `$fetch.create({ baseURL: apiProxyPath || apiURL, credentials: 'include', retry: false })`. In `nuxt dev`, `apiProxyPath` is `/_api` and Nitro's `devProxy` forwards it to `NUXT_PUBLIC_API_URL`, because the API's CORS allowlist rejects localhost and its cookies are scoped to `.syncra.app`.

## Reads: `useApiQuery`

```ts
const review = useApiQuery(
  `techpack-reviews:item:${fileId}`,
  ({ signal }) => api.get('/admin/docai/techpack-reviews/{fileId}', { path: { fileId }, signal, model: reviewItemModel }),
  { enabled: fileId > 0 },
)
review.data       // the model, or undefined
review.loading    // first load: nothing to show yet
review.refreshing // reloading while the previous data is shown
review.error      // ApiError | undefined
review.refresh()
```

- **The key is `'<feature>:<name>:<inputs…>'`.** Use a getter (`() => \`…:${page.value}\``) when inputs change. A new key loads again, and the previous key's data stays on screen while it loads. Put every input the request uses into the key.
- Pass `signal` through: a newer load cancels the older one.
- `enabled` (a boolean or getter) holds the load until its inputs exist, for example a `draftUuid`.
- When a refresh fails for the connection or the server, the last good data stays on screen. A refusal (404, `success: false`) clears it.
- Components using the same key share one request and its data.
- Inline errors use `errorMessage(error, 'Could not load …')`: the API's reason when there is one, otherwise the fallback.

## Writes: `useApiMutation`

```ts
const approve = useApiMutation(
  (item: ReviewItem) => api.post('/admin/docai/techpack-reviews/{fileId}/approve', { path: { fileId: item.fileId }, body: { draftUuid: item.draftUuid!, sourceVerified: true } }),
  { success: 'Workbook reviewed and released.', error: 'Could not approve the workbook', invalidate: ['techpack-reviews'] },
)

const result = await approve.execute(item)   // { ok: true, data } | { ok: false, error }; never throws
if (result.ok) await router.replace({ path: '/techpack-reviews', query: { status: 'reviewed' } })
```

- **No `try`/`catch` in features.** The helper shows the toasts: `success` text on success, and on failure a toast titled `error` with the `ApiError`'s message. Silent errors (a cancelled request, an ended session) show nothing.
- `pending` is true while a call runs. A second `execute` during that time is skipped, so a double click sends once.
- `invalidate` refreshes the queries on screen whose key starts with one of the given prefixes (`'techpack-reviews'`, or a narrower `'techpack-reviews:item'`). `invalidateQueries(...)` does the same by hand.
- Navigate with a router captured during setup (`const router = useRouter()`), not `navigateTo`, because the code runs after an `await`.
- Use `useAppToast().failed(text)` for a failure the composable decides itself, such as `forgotPassword` resolving with `sent: false`.
- Destructive actions ask first with `<ModalConfirm>`.

## Lists: `useListQuery`

```ts
const list = useListQuery({ status: ['in-review', 'reviewed'] as const })   // first choice = default
list.filters.value.status                  // from the URL; unknown values read as the default
list.page.value                            // 1-based, from the URL
list.setFilters({ status: 'reviewed' })    // back to page 1
list.setPage(2)
list.clampPage(totalPages)                 // after a load: past the end → last page
```

The URL is the state (`/techpack-reviews?status=reviewed&page=2`), so reload, Back, and shared links keep the place, and defaults are left out of it. The Admin API's page is **zero-based**: send `page - 1`. `features/techpack-review/composables/useReviewQueue.ts` is the reference. Links into a record pass the list's query along, so the record's Back link returns to the same tab and page.

## Errors

Every failure is one thrown `ApiError` (inside the helpers, a value in `error` or `result.error`):

| `kind` | When | `message` |
| --- | --- | --- |
| `rejected` | A `success: false` envelope (on any status except 401 and 403), or another 4xx | The API's `reason`, if any |
| `validation`, `not_found`, `conflict`, `forbidden` | 400/422, 404, 409, 403 | The API's `reason`, if any |
| `unauthorized` | 401 that couldn't be recovered | "Your session has expired…" |
| `contract` | The response doesn't match the `model` | `Unexpected response from GET /admin/… (field: issue)` |
| `server`, `network`, `timeout`, `aborted`, `unknown` | 5xx without an envelope, no response, timeout, cancelled, anything else | A fixed, user-safe message |

`retryable` is true for `network`, `timeout`, and `server`. `silent` is true for cancelled requests and for the 401 that ended the session. `ApiError.from(e)` finds the API error inside wrappers such as `useAsyncData`'s.

## The API contract

| Piece | Where | Notes |
| --- | --- | --- |
| Spec snapshot | `openapi/syncra.json` | Committed. Refresh it with `pnpm --filter admin api:pull`, which reads `NUXT_PUBLIC_API_URL` from `.env`. |
| Generated contract | `app/api/generated/` | `pnpm --filter admin api:gen` runs `openapi-ts`, then `scripts/gen-endpoints.mjs`. Never edit these files. `Api.*` types, `v*` Valibot schemas, and the endpoint map, for `/admin/**` only. |
| Contract helpers | `app/api/contract.ts` | `defineModel`, `parseData`, `ApiErrorBody` |
| Models | `features/<f>/models/<name>.ts` | What the feature needs from a response |

**Every generated field is optional and nullable**, because the spec doesn't say which fields are required. Don't use `!`, `?? 0`, or defaults to hide that. Declare what the feature needs in a model:

```ts
// features/techpack-review/models/review-item.ts
export const reviewItemModel = defineModel(vReviewItem, {
  required: ['fileId', 'jobId', 'companyId', 'filename', 'status'], // present and not null
  optional: ['draftUuid', 'reviewedAt'],                            // may be null or missing
})
export type ReviewItem = v.InferOutput<typeof reviewItemModel>
```

- **Lists** are parsed whole: `v.object({ content: v.array(reviewItemModel), totalPages: v.number() })`. If one row is bad, the request fails. Never drop rows silently.
- **Request bodies** are typed by the endpoint map. A form keeps its own schema and maps its values to the body.
- **After a spec change**, run `api:pull` and then `api:gen`. Commit the spec and the generated output together. A removed or changed endpoint now fails typecheck where it's called; fix those call sites.

## The session

The `session` feature (`app/features/session/`) owns who is signed in. It's navigation state only: the API checks the session on every request, and there is no staff role map.

```ts
import { useSession } from '@/features/session'

const session = useSession()
session.status     // 'unknown' | 'signed-in' | 'signed-out' (readonly)
session.staff      // StaffProfile | null (readonly)
session.signedIn   // computed
```

| Action | Does |
| --- | --- |
| `load()` | Loads the profile once; concurrent callers share the request. Any failure means signed out. Called by the route guard on the first navigation. |
| `reload()` | Loads the profile again after the cookies changed (password reset, another tab signed in). |
| `signIn(body)` | Logs in, then loads the profile. Throws `ApiError` if either fails. Tells the other tabs. |
| `signOut()` | Logs out, then clears the session and goes to sign-in. If the API doesn't confirm, it throws and the session is kept. Tells the other tabs. |
| `end(reason)` | Ends the session locally: `'expired'` (from the API client; shows "Session expired") or `'signed-out-elsewhere'`. Idempotent. Goes to sign-in with `?redirect=` only if someone was signed in. |

`features/auth` wraps the actions for the forms in `useApiMutation`: `useSignIn`, `useSignOut`, `useForgotPassword`, and `useResetPassword`.

**Session renewal.** On a 401, the client calls `renewSession()` (`POST /admin/auth/refresh`) and retries the request once:

- Concurrent 401s share **one** renewal. A request that started before a renewal finished retries without renewing again, because its 401 was for the old cookies.
- Tabs renew one at a time (Web Locks), because they share the refresh cookie. A tab that waited retries with the cookies the other tab got.
- A **refused** renewal ends the session (`end('expired')`), and the request throws a silent `unauthorized`. Refused means `rejected`, `unauthorized`, `forbidden`, or `validation`. The API answers a missing refresh cookie with HTTP 500 and a `success: false` envelope, which counts as `rejected` ([open question](../../../docs/product/open-questions.md#admin)).
- A **transient** renewal failure (network, timeout, a 5xx without an envelope) is thrown to the caller, and the session stays.
- The renewal times out after 10 seconds.

**Tabs stay in step.** `useSessionSync` (started by the plugin) broadcasts sign-in and sign-out. Another tab reloads its profile, or ends its session.

**State tied to the staff session.** If you add `useState` that belongs to the signed-in staff member, clear it in `useSession`'s `clear()`.

`useStorage()` keeps UI preferences (sidebar state) in `localStorage`. Never store records or personal data there.
