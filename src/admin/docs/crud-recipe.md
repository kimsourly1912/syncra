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
| Company identity | Always from `useProfileStore().companyId` | Staff work across companies, so an Admin screen takes the record's id from the **route** (`/account/[id]` is a portal user's id). The server must check that the staff member may act on it. Validate the param: a positive integer, otherwise show "not found". |
| Toasts | `toast.add('success', …)`, `toast.addException(e)` | `toast.success(msg)`, `toast.failed(msg)`, `toast.error(e)` |
| Failures | A resolved `success: false` and a thrown error | One thrown `ApiError` ([errors](data-access.md#errors)) |
| List state | `reactive` query + `useAsyncData` watch | `useListQuery`: the query lives in the URL, and a change cancels the older request ([list rules](data-access.md#lists-uselistquery)) |
| Confirm dialog | `<ModalConfirmation>` with `loading` | `<ModalConfirm>` emits `confirm` and `cancel`, and has no loading prop. Disable the trigger while pending, and close the dialog after the request. |
| Text | i18n | English only |

## Files

```text
app/features/product/models/product.ts                 exists (the UI's shape): replace with defineModel(vProductResponse, …) + list model
app/features/product/schemas/product-form.ts            form schema + toProductRequest(form)
app/features/product/composables/useProductList.ts      useApiList
app/features/product/composables/useProductActions.ts   useApiMutation per write
app/features/product/composables/useProductReorder.ts   exists: drag and ↑/↓ reorder; save the order once the API takes it
app/features/product/components/ProductListScreen.vue   exists (sample data): switch it to useProductList
app/features/product/components/ProductFormScreen.vue   exists (UI only): wire its Save to useProductActions
app/features/product/components/ProductEditScreen.vue   exists: swap findSampleProduct(id) for a useApiQuery of the record
app/pages/product/index.vue, create.vue, [id].vue       already thin; leave them
```

Delete `fixtures/products.ts` once nothing reads it. `ProductFormScreen` (about 420 lines) is one file only because nothing is wired yet: as you wire it, move each form section and the preview into its own component in `components/`, so the screen holds the form state, the save, and the layout.

There is no service file: composables call `api` with the spec's paths. Every page is staff-only by default (`middleware/access.global.ts`), so `/product/**` needs no guard setup. The sidebar shows the Product link once a page exists.

## The list composable

```ts
// app/features/product/composables/useProductList.ts (illustrative: confirm the real endpoint first)
import { api } from '@/api'
import { productPageModel } from '../models/product'

export function useProductList() {
  // The key is `product:list:<URL state>`, and `query` holds the zero-based page, size, and search.
  const products = useApiList(
    'product:list',
    { status: ['active', 'archived'] as const },
    { search: true, pageSizes: LIST_PAGE_SIZES },   // only if the endpoint takes `search` and `size`
    ({ filters, query, signal }) => api.get('/admin/products', {
      query: { ...query, status: filters.status },
      signal,
      model: productPageModel,                      // returns { items, totalPages }
    }),
  )

  return {
    ...products, // URL state and setters, items, totalPages, loaded, loading, refreshing, pending, error, refresh
    tab: computed(() => products.filters.value.status),
  }
}
```

Add `'product'` to `QUERY_FEATURES` (`composables/useApiQuery.ts`) with its first query.

## Writes

```ts
// app/features/product/composables/useProductActions.ts (illustrative)
export function useProductActions() {
  const router = useRouter()
  const create = useApiMutation(
    (form: IProductFormSchema) => api.post('/admin/products', { body: toProductRequest(form) }),
    { success: 'Product saved', error: 'Could not save the product', invalidate: ['product'] },
  )

  async function save(form: IProductFormSchema) {
    if ((await create.execute(form)).ok) await router.push('/product')
  }
  return { save, saving: create.pending }
}
```

The action acts only on `result.ok`. For review-style workflows, carry the record's version or draft identity (`draftUuid`) on every save, and reload after each save ([data access → writes](data-access.md#writes-useapimutation)).

## Verify

- `pnpm --filter admin verify` (lint, typecheck, test) and `pnpm --filter admin build`
- Add a `features/<feature>/tests/<screen>.nuxt.test.ts` that answers through `fakeApi` and covers the model, a refused request, a contract error, and the requests each action sends ([testing](testing.md))
- In the browser: the list with data, empty, and with a failed request; creating, editing, and deleting a record; and page and filter changes, including Back
