# Admin data access

How Admin talks to the API. The service shape is in [shared conventions](../../../docs/conventions.md#service-files). Admin doesn't use DTO files; it uses the [generated contract](#the-api-contract) instead. The reasoning is in [decision 0003](../../../docs/decisions/0003-request-and-error-flow.md) and [decision 0007](../../../docs/decisions/0007-generated-api-contract.md).

## The client stack

| Piece | File | Notes |
| --- | --- | --- |
| `$api` | `app/plugins/api.client.ts` | `$fetch.create({ baseURL: apiProxyPath \|\| apiURL, credentials: 'include' })`. `apiURL` is `NUXT_PUBLIC_API_URL`. In `nuxt dev`, `apiProxyPath` is `/_api` and Nitro's `devProxy` forwards it to `apiURL`, because the API's CORS allowlist rejects localhost and LAN origins and its session cookies are scoped to `.syncra.app`. Deployed builds call `apiURL` directly. |
| `useAPI<T>` | `app/composables/useAPI.ts` | A plain async function. On a 401 (`STATUS_CODE.expiry`), it refreshes once with a shared mutex and retries. If it's still 401, it calls `useAuth().logoutProps().execute()` and throws. |
| `useRawAPI<T>` | same file | No refresh. Used by the auth calls. |
| Services | `features/<f>/services/`; shell-level `app/services/session.service.ts` | Admin API paths start with `admin/…`. For example, `getProfile` calls `admin/users/me/profile`. |

`useAPI` calls Nuxt composables (`useNuxtApp`, `useAuth`). A feature composable captures `const nuxtApp = useNuxtApp()` during setup, and wraps service calls made after an `await` in `nuxtApp.runWithContext(() => service(...))`, so the Nuxt context is still available. `useReviewDetail` is the reference.

## The API contract

The reasoning is in [decision 0007](../../../docs/decisions/0007-generated-api-contract.md). New code uses the generated contract and feature models. It doesn't add DTO files.

| Piece | Where | Notes |
| --- | --- | --- |
| Spec snapshot | `openapi/syncra.json` | Committed. Refresh it with `pnpm --filter admin api:pull`, which reads `NUXT_PUBLIC_API_URL` from `.env`. |
| Generated contract | `app/api/generated/` | `pnpm --filter admin api:gen`. Never edit these files. Contains `Api.*` types and `v*` Valibot schemas for `/admin/**` only. |
| Contract helpers | `app/api/contract.ts` | `defineModel`, `parseEnvelope`, `parseData`, `ApiContractError`, `ApiErrorBody`. Import everything from `@/api`. |
| Models | `features/<f>/models/<name>.ts` | What the feature needs from a response |
| Services | `features/<f>/services/<resource>.service.ts` | Transport plus parsing. They return models, never raw API types. |

**Every generated field is optional and nullable**, because the spec doesn't say which fields are required. Don't use `!`, `?? 0`, or defaults to hide that. Declare what the feature needs in a model:

```ts
// features/techpack-review/models/review-item.ts
import * as v from 'valibot'
import { defineModel, vReviewItem } from '@/api'

export const reviewItemModel = defineModel(vReviewItem, {
  required: ['fileId', 'jobId', 'companyId', 'filename', 'status'], // present and not null
  optional: ['draftUuid', 'reviewedAt'],                            // may be null or missing
})
export type ReviewItem = v.InferOutput<typeof reviewItemModel>
```

```ts
// features/techpack-review/services/techpack-review.service.ts
export async function getReview(fileId: number) {
  const endpoint = buildEndPoint<Parts>(PREFIX.admin, ['docai', 'techpack-reviews', fileId])
  const res = await useAPI<Api.ResponseMsgReviewItem>(endpoint, { method: 'GET' })
  return parseEnvelope(res, reviewItemModel, `GET ${endpoint}`)
}
```

- `parseEnvelope` returns `{ success: true, data }` or `{ success: false, reason, msg }`. It checks `data` only when `success` is true, so the composable's `if (!res.success)` branch still works. Use `parseData` for bodies without an envelope (`sale-requests`, `lead-inquiries`).
- A mismatch throws `ApiContractError`, naming the endpoint and the field. It goes down the normal thrown-error path, and `toast.exception(e)` shows its message.
- **Lists** are parsed whole: `v.object({ content: v.array(reviewItemModel), totalPages: v.number() })`. If one row is bad, the request fails. Never drop rows silently.
- **Request bodies** use the generated type, for example `Api.SuperAdminLoginRequest`. A form keeps its own schema and maps its values to the body in a separate function. It can reuse rules from the generated `v*` schemas.
- **After a spec change**, run `api:pull` and then `api:gen`. Commit the spec and the generated output together, and fix any code that lint or build flags.

## Lists

Copy `features/techpack-review/composables/useReviewQueue.ts`:

- **URL state.** Filters and the page live in `route.query`. Bound and normalize them: the page is a zero-based integer, and an unknown status falls back to a default. Change them with `navigateTo({ query })`, so Back and links work.
- **Stale requests.** Before each load, abort the previous request (`listRequest?.abort()`, then a new `AbortController` passed as `signal`). Ignore results and errors from an aborted request, and abort on unmount.
- **States.** Keep `loading`, `listError`, empty, and items separate, as the [ui doc](ui.md#required-states) describes.
- **Empty page.** If a non-zero page comes back empty, replace the URL with the last valid page.
- **Response shape.** Admin lists return a `ResponseMsgPage*` envelope. Parse it into a list model such as `reviewPageModel` (`{ content: Model[], totalPages }`). The page is zero-based. The UI shows `page + 1`.

## Writes

The rules match Portal's, using Admin's toast helper:

```ts
const toast = useAppToast()
const pending = shallowRef(false)

async function saveProduct(form: IProductFormSchema) {          // illustrative form schema
  pending.value = true
  try {
    const res = await createProduct(toProductRequest(form))      // service returns a parsed envelope
    if (!res.success) {                // failure path 1: resolved with success: false
      toast.failed(res.reason || 'Could not save the product')
      return false
    }
    toast.success('Product saved')
    return true
  }
  catch (e) {                          // failure path 2: thrown FetchError or ApiContractError
    toast.exception(e)
    return false
  }
  finally {
    pending.value = false
  }
}
```

- `useAppToast()` returns `{ success(description), failed(description), exception(e), base }`. This is a different API from Portal's `toast.add(type, …)`. Don't mix them up.
- `exception(e)` shows an `ApiContractError` or any other non-fetch error by its message. For a `FetchError`, it reads `data.reason`, then `data.detail`, then falls back to "Internal Server error".
- **Review writes.** Save with the current `draftUuid`, then reload the inspection. Clear the reviewer's attestation (`confirmed`) whenever the draft changes. Approve only when the inspection is current and attested, then go back to the Reviewed queue.
- Destructive actions ask first with `<ModalConfirm>`.

## Errors in lists

`techpack-reviews/index.vue` reads a thrown error's `data.reason`, `data.detail`, or `data.msg`, then falls back to a fixed message, and shows it in a `UAlert`. Reuse that order.

## Session

- `useAuth()` returns `authState` (`useState`), `isAuthenticated`, `onSuccess(fn)` (refresh the profile, set the state, run `fn`), `logoutProps()`, and `setAuthState`.
- `useProfile()` returns `key`, `data`, `pending`, `refresh()`, and `clear()` over `useNuxtData(ASYNC_DATA.profile)`.
- Logout clears the profile data. If you add `useState` tied to a staff session, clear it in the logout flow too.
- `useStorage()` keeps UI preferences (sidebar state) in `localStorage`. Never store records or personal data there.
