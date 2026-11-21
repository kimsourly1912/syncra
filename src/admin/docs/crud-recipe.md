# Admin CRUD recipe

Use this recipe to wire a static Admin screen to the API, or to add a new staff resource. The layers and code shapes match the [Portal CRUD recipe](../../portal/docs/crud-recipe.md). This page covers only how Admin differs. The examples use a made-up `products` resource. Confirm the real Admin endpoints before you build ([open questions → Admin](../../../docs/product/open-questions.md#admin)).

## Step 0: write down the contract

Before you touch a static screen, add this to the PR or the feature spec:

- the endpoints and methods, and which fields the screen requires from each response. Check them against the generated `Api.*` types after `api:pull` and `api:gen`.
- the staff permission the API enforces
- the validation rules, and what happens after a save (where the user lands, which data reloads)
- what the static placeholder data becomes. Delete the placeholder data once the screen is wired.

## How Admin differs from Portal

| Topic | Portal | Admin |
| --- | --- | --- |
| Company identity | Always from `useProfileStore().companyId` | Staff work across companies, so a company-scoped Admin screen gets `companyId` from the **route** (`/account/[id]`). The server must check that the staff member may act on it. Validate the param: it must be a positive integer, otherwise show "not found". |
| Toasts | `toast.add('success', …)`, `toast.addException(e)` | `toast.success(msg)`, `toast.failed(msg)`, `toast.error(e)` |
| Failures | A resolved `success: false` and a thrown error | One thrown `ApiError` ([errors](data-access.md#errors)) |
| List state | `reactive` query + `useAsyncData` watch | Query in the URL (`route.query`) + an aborted request on change. See the [list rules](data-access.md#lists). |
| Confirm dialog | `<ModalConfirmation>` with `loading` | `<ModalConfirm>` emits `confirm` and `cancel`, and has no loading prop. Disable the trigger while pending, and close the dialog after the request. |
| Tables | Nuxt UI defaults | `:ui="tableTheme"` from `@/theme/table` |
| Text | i18n | English only |

## Files

```text
app/features/product/models/product.ts    defineModel(vProductResponse, { required, optional }) + list model
app/features/product/services/product.service.ts   PREFIX 'admin', buildEndPoint<Parts>, api.get/post with a model
app/features/product/schemas/product-form.ts
app/features/product/composables/useProducts.ts   list (URL state + abort), save, remove
app/features/product/components/ProductListScreen.vue
app/features/product/components/ProductForm.vue
app/pages/product/index.vue               thin: <ProductListScreen />
app/pages/product/create.vue, [id].vue    thin: <ProductForm :product-id="…" />
```

Every page is staff-only by default (`middleware/access.global.ts`), so `/product/**` needs no guard setup. Add a sidebar entry in `layouts/default.vue` once the page exists.

## The list composable

```ts
// app/features/product/composables/useProducts.ts (illustrative)
import { errorMessage } from '@/api'
import type { Product } from '../models/product'
import * as productService from '../services/product.service'

export function useProductList() {
  const route = useRoute()

  const page = computed(() => {
    const value = Number(route.query.page)
    return Number.isInteger(value) && value > 0 ? value : 0
  })
  const items = ref<Product[]>([])
  const totalPages = ref(0)
  const loading = ref(false)
  const error = ref('')
  let request: AbortController | undefined

  async function load() {
    request?.abort()
    const current = new AbortController()
    request = current
    loading.value = true
    error.value = ''
    try {
      const data = await productService.listProducts({ page: page.value }, current.signal)
      if (current.signal.aborted) return
      items.value = data.content
      totalPages.value = data.totalPages
    }
    catch (e) {
      if (current.signal.aborted) return
      error.value = errorMessage(e, 'Could not load products.')
    }
    finally {
      if (!current.signal.aborted) loading.value = false
    }
  }

  function showPage(next: number) {
    return navigateTo({ path: '/product', query: next > 0 ? { page: String(next) } : {} })
  }

  watch(page, load)
  onMounted(load)
  onBeforeUnmount(() => request?.abort())

  return { page, items, totalPages, loading, error, load, showPage }
}
```

The service takes the `signal` and passes it through: `api.get(endpoint, { query, signal, model: productPageModel })`. `features/techpack-review/services/techpack-review.service.ts` is the working reference.

## Writes

Follow [data access → writes](data-access.md#writes): the action returns `true` only after a confirmed success, and the caller then navigates (`navigateTo('/product')`) or reloads. For review-style workflows, carry the record's version or draft identity (`draftUuid`) on every save, and reload after each save.

## Verify

- `pnpm --filter admin exec eslint .`, `pnpm --filter admin test`, and `pnpm --filter admin build`
- Add a `test/nuxt/<feature>-service.test.ts` that answers through `fakeApi` and covers the model, a refused request, and a contract error ([testing](testing.md))
- In the browser: the list with data, empty, and with a failed request; creating, editing, and deleting a record; and page and filter changes, including Back
