# Admin data access

How Admin talks to the API and keeps the staff session. The service shape is in [shared conventions](../../../docs/conventions.md#service-files). Admin doesn't use DTO files; it uses the [generated contract](#the-api-contract). The reasoning is in [decision 0008](../../../docs/decisions/0008-admin-api-client-and-session.md) (client, session, route access) and [decision 0007](../../../docs/decisions/0007-generated-api-contract.md) (contract).

## The client

Everything API-related is imported from `@/api`.

| Piece | File | Notes |
| --- | --- | --- |
| `api.get / post / put / patch / delete` | `app/api/client.ts` | Resolves to the request's `model` output, or `undefined` without one. Throws `ApiError`. Needs no Nuxt context, so it works after an `await` and in click handlers. |
| `api.download` | same | Resolves to a `Blob`; the body isn't an envelope or parsed. |
| `ApiError`, `errorMessage` | `app/api/errors.ts` | The only error the API layer throws. See [errors](#errors). |
| Session recovery | `app/api/recovery.ts` | 401 handling. See [the session](#the-session). |
| `configureApi` | `app/api/index.ts` | Called once by `plugins/session.client.ts`, with `$fetch.create({ baseURL: apiProxyPath \|\| apiURL, credentials: 'include', retry: false })`. |

`apiURL` is `NUXT_PUBLIC_API_URL`. In `nuxt dev`, `apiProxyPath` is `/_api` and Nitro's `devProxy` forwards it to `apiURL`, because the API's CORS allowlist rejects localhost and LAN origins and its session cookies are scoped to `.syncra.app`. Deployed builds call `apiURL` directly.

Request options: `query`, `body`, `signal`, `headers`, `timeout`, and:

- `model`: what the feature needs from the response ([the API contract](#the-api-contract)).
- `envelope: false`: for the few bodies without a `ResponseMsg*` envelope (`sale-requests`, `lead-inquiries`).
- `auth: false`: only for the calls that set or clear session cookies (sign-in, password reset, refresh, logout). A 401 is then thrown as it is, with no renewal.

Nothing is retried except one retry after a renewed session, so a write is never sent twice behind the caller's back.

## The API contract

| Piece | Where | Notes |
| --- | --- | --- |
| Spec snapshot | `openapi/syncra.json` | Committed. Refresh it with `pnpm --filter admin api:pull`, which reads `NUXT_PUBLIC_API_URL` from `.env`. |
| Generated contract | `app/api/generated/` | `pnpm --filter admin api:gen`. Never edit these files. Contains `Api.*` types and `v*` Valibot schemas for `/admin/**` only. |
| Contract helpers | `app/api/contract.ts` | `defineModel`, `parseData`, `ApiErrorBody` |
| Models | `features/<f>/models/<name>.ts` | What the feature needs from a response |
| Services | `features/<f>/services/<resource>.service.ts` | Endpoint, method, query, body, and `model`. They return models, never raw API types. |

**Every generated field is optional and nullable**, because the spec doesn't say which fields are required. Don't use `!`, `?? 0`, or defaults to hide that. Declare what the feature needs in a model:

```ts
// features/techpack-review/models/review-item.ts
export const reviewItemModel = defineModel(vReviewItem, {
  required: ['fileId', 'jobId', 'companyId', 'filename', 'status'], // present and not null
  optional: ['draftUuid', 'reviewedAt'],                            // may be null or missing
})
export type ReviewItem = v.InferOutput<typeof reviewItemModel>
```

```ts
// features/techpack-review/services/techpack-review.service.ts
export async function getReview(fileId: number, signal?: AbortSignal) {
  return api.get(fileEndpoint(fileId), { signal, model: reviewItemModel })   // Promise<ReviewItem>
}
```

- A service that validates its input (`fileEndpoint` rejects `fileId <= 0`) is `async`, so that refusal rejects like any other failure.
- **Lists** are parsed whole: `v.object({ content: v.array(reviewItemModel), totalPages: v.number() })`. If one row is bad, the request fails. Never drop rows silently.
- **Request bodies** use the generated type, for example `Api.SuperAdminLoginRequest`. A form keeps its own schema and maps its values to the body in a separate function.
- **After a spec change**, run `api:pull` and then `api:gen`. Commit the spec and the generated output together, and fix any code that lint or build flags.

## Errors

A request has **one failure path**: it throws `ApiError`. A `success: false` envelope, an HTTP error, a network failure, a timeout, a cancelled request, and a response that breaks the model all arrive in the same `catch`. Nobody checks `success`.

| `kind` | When | `message` |
| --- | --- | --- |
| `rejected` | A `success: false` envelope (on any status except 401 and 403), or another 4xx | The API's `reason`, if any |
| `validation`, `not_found`, `conflict`, `forbidden` | 400/422, 404, 409, 403 | The API's `reason`, if any |
| `unauthorized` | 401 that couldn't be recovered | "Your session has expired…" |
| `contract` | The response doesn't match the `model` | `Unexpected response from GET admin/… (field: issue)` |
| `server`, `network`, `timeout`, `aborted`, `unknown` | 5xx without an envelope, no response, timeout, cancelled, anything else | A fixed, user-safe message |

- `error.silent` is true for a cancelled request and for the 401 that ended the session (the user is already being sent to sign-in). Show nothing for it.
- `useAppToast().error(e)` shows any thrown error by its message, and skips silent ones. It logs contract and unknown errors.
- `errorMessage(e, fallback)` is for inline alerts: the API's reason when there is one, the contract message, or else your screen-specific `fallback`.

## Lists

Copy `features/techpack-review/composables/useReviewQueue.ts`:

- **URL state.** Filters and the page live in `route.query`. Bound and normalize them: the page is a zero-based integer, and an unknown status falls back to a default. Change them with `navigateTo({ query })`, so Back and links work.
- **Stale requests.** Before each load, abort the previous request (`listRequest?.abort()`, then a new `AbortController` passed as `signal`). Ignore results and errors from an aborted request, and abort on unmount.
- **States.** Keep `loading`, `listError`, empty, and items separate, as the [ui doc](ui.md#required-states) describes. Set `listError` with `errorMessage(error, 'Could not load …')`.
- **Empty page.** If a non-zero page comes back empty, replace the URL with the last valid page.
- **Response shape.** Admin lists return a `ResponseMsgPage*` envelope. Parse it into a list model such as `reviewPageModel` (`{ content: Model[], totalPages }`). The page is zero-based. The UI shows `page + 1`.

## Writes

```ts
const toast = useAppToast()
const pending = shallowRef(false)

async function saveProduct(form: IProductFormSchema) {          // illustrative form schema
  pending.value = true
  try {
    await createProduct(toProductRequest(form))                  // resolves only on confirmed success
    toast.success('Product saved')
    return true
  }
  catch (e) {                                                    // every failure, as ApiError
    toast.error(e)
    return false
  }
  finally {
    pending.value = false
  }
}
```

- `useAppToast()` returns `{ success(description), failed(description), error(e), base }`. This is a different API from Portal's `toast.add(type, …)`. Don't mix them up.
- Use `failed(description)` for a failure the composable decides itself, such as `forgotPassword` resolving with `sent: false`.
- **Review writes.** Save with the current `draftUuid`, then reload the inspection. Clear the reviewer's attestation (`confirmed`) whenever the draft changes. Approve only when the inspection is current and attested, then go back to the Reviewed queue.
- Destructive actions ask first with `<ModalConfirm>`.

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

`features/auth` wraps the actions for the UI: `useSignIn`, `useSignOut`, `useForgotPassword`, and `useResetPassword` own `pending` and the toasts.

**Session renewal.** On a 401, the client renews the session cookies (`POST admin/auth/refresh`) and retries the request once:

- Concurrent 401s share **one** renewal. A request that started before a renewal finished retries without renewing again, because its 401 was for the old cookies.
- Tabs renew one at a time (Web Locks), because they share the refresh cookie. A tab that waited retries with the cookies the other tab got.
- A **refused** renewal ends the session (`end('expired')`), and the request throws a silent `unauthorized`. Refused means `rejected`, `unauthorized`, `forbidden`, or `validation`. The API answers a missing refresh cookie with HTTP 500 and a `success: false` envelope, which counts as `rejected` ([open question](../../../docs/product/open-questions.md#admin)).
- A **transient** renewal failure (network, timeout, a 5xx without an envelope) is thrown to the caller, and the session stays.
- The renewal times out after 10 seconds.

**Tabs stay in step.** `useSessionSync` (started by the plugin) broadcasts sign-in and sign-out. Another tab reloads its profile, or ends its session. Only the event crosses tabs.

**State tied to the staff session.** If you add `useState` that belongs to the signed-in staff member, clear it in `useSession`'s `clear()`.

`useStorage()` keeps UI preferences (sidebar state) in `localStorage`. Never store records or personal data there.
