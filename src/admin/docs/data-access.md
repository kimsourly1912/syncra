# Admin data access

How Admin talks to the API. The service and DTO shapes are in [shared conventions](../../../docs/conventions.md#service-files). The reasoning is in [decision 0003](../../../docs/decisions/0003-request-and-error-flow.md).

## The client stack

| Piece | File | Notes |
| --- | --- | --- |
| `$api` | `app/plugins/api.client.ts` | `$fetch.create({ baseURL: apiURL, credentials: 'include' })`. `apiURL` is `PROXY_API_PATH` or `NUXT_PUBLIC_API_URL`. |
| `useAPI<T>` | `app/composables/useAPI.ts` | A plain async function. On a 401 (`STATUS_CODE.expiry`), it refreshes once with a shared mutex and retries. If it's still 401, it calls `useAuth().logoutProps().execute()` and throws. |
| `useRawAPI<T>` | same file | No refresh. Used by the auth calls. |
| Services | `app/services/auth.service.ts`, `profile.service.ts` | Admin API paths start with `admin/…`. For example, `getProfile` calls `admin/users/me/profile`. |

`useAPI` calls Nuxt composables (`useNuxtApp`, `useAuth`). The TechPack pages call it inside `nuxtApp.runWithContext(() => useAPI(...))` after an `await`, so the Nuxt context is still available. A new service called from a feature composable can keep the same guard: capture `const nuxtApp = useNuxtApp()` during setup, and wrap calls made after an `await`.

## Lists

Copy `pages/techpack-reviews/index.vue`, and move its logic into a feature composable for new work:

- **URL state.** Filters and the page live in `route.query`. Bound and normalize them: the page is a zero-based integer, and an unknown status falls back to a default. Change them with `navigateTo({ query })`, so Back and links work.
- **Stale requests.** Before each load, abort the previous request (`listRequest?.abort()`, then a new `AbortController` passed as `signal`). Ignore results and errors from an aborted request, and abort on unmount.
- **States.** Keep `loading`, `listError`, empty, and items separate, as the [ui doc](ui.md#required-states) describes.
- **Empty page.** If a non-zero page comes back empty, replace the URL with the last valid page.
- **Response shape.** Admin lists use `BaseRes<{ content: T[], totalPages: number }>`. The page is zero-based. The UI shows `page + 1`.

## Writes

The rules match Portal's, using Admin's toast helper:

```ts
const toast = useAppToast()
const pending = shallowRef(false)

async function saveProduct(req: ProductDTO.ProductSaveReq) {   // illustrative DTO
  pending.value = true
  try {
    const res = await productService.createProduct(req)
    if (!res.success) {                // failure path 1: resolved with success: false
      toast.failed(res.reason || 'Could not save the product')
      return false
    }
    toast.success('Product saved')
    return true
  }
  catch (e) {                          // failure path 2: thrown FetchError
    toast.exception(e)
    return false
  }
  finally {
    pending.value = false
  }
}
```

- `useAppToast()` returns `{ success(description), failed(description), exception(e), base }`. This is a different API from Portal's `toast.add(type, …)`. Don't mix them up.
- `exception(e)` reads `data.reason`, then `data.detail`, then falls back to "Internal Server error".
- **Review writes.** Save with the current `draftUuid`, then reload the inspection. Clear the reviewer's attestation (`confirmed`) whenever the draft changes. Approve only when the inspection is current and attested, then go back to the Reviewed queue.
- Destructive actions ask first with `<ModalConfirm>`.

## Errors in lists

`techpack-reviews/index.vue` reads a thrown error's `data.reason`, `data.detail`, or `data.msg`, then falls back to a fixed message, and shows it in a `UAlert`. Reuse that order.

## Session

- `useAuth()` returns `authState` (`useState`), `isAuthenticated`, `onSuccess(fn)` (refresh the profile, set the state, run `fn`), `logoutProps()`, and `setAuthState`.
- `useProfile()` returns `key`, `data`, `pending`, `refresh()`, and `clear()` over `useNuxtData(ASYNC_DATA.profile)`.
- Logout clears the profile data. If you add `useState` tied to a staff session, clear it in the logout flow too.
- `useStorage()` keeps UI preferences (sidebar state) in `localStorage`. Never store records or personal data there.
