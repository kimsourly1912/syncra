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
| Text | i18n | English only |

## Files

```text
app/features/product/models/product.ts                 defineModel(vProductResponse, { required, optional }) + list model
app/features/product/schemas/product-form.ts            form schema + toProductRequest(form)
app/features/product/composables/useProductList.ts      useListQuery + useApiQuery
app/features/product/composables/useProductActions.ts   useApiMutation per write
app/features/product/components/ProductListScreen.vue
app/features/product/components/ProductForm.vue
app/pages/product/index.vue                             thin: <ProductListScreen />
app/pages/product/create.vue, [id].vue                  thin: <ProductForm :product-id="…" />
```

There is no service file: composables call `api` with the spec's paths. Every page is staff-only by default (`middleware/access.global.ts`), so `/product/**` needs no guard setup. The sidebar shows the Product link once a page exists.

## The list composable

```ts
// app/features/product/composables/useProductList.ts (illustrative: confirm the real endpoint first)
import { api, errorMessage } from '@/api'
import { productPageModel } from '../models/product'

export function useProductList() {
  const list = useListQuery({ status: ['active', 'archived'] as const })

  const products = useApiQuery(
    () => `products:list:${list.filters.value.status}:${list.page.value}`,
    ({ signal }) => api.get('/admin/products', {
      query: { status: list.filters.value.status, page: list.page.value - 1 },   // the API's page is zero-based
      signal,
      model: productPageModel,
    }),
  )
  watch(() => products.data.value?.totalPages, total => total !== undefined && list.clampPage(total))

  return {
    ...list,
    items: computed(() => products.data.value?.content ?? []),
    totalPages: computed(() => products.data.value?.totalPages ?? 0),
    loading: products.loading,
    error: computed(() => (products.error.value ? errorMessage(products.error.value, 'Could not load products.') : '')),
    refresh: products.refresh,
  }
}
```

## Writes

```ts
// app/features/product/composables/useProductActions.ts (illustrative)
export function useProductActions() {
  const router = useRouter()
  const create = useApiMutation(
    (form: IProductFormSchema) => api.post('/admin/products', { body: toProductRequest(form) }),
    { success: 'Product saved', error: 'Could not save the product', invalidate: ['products'] },
  )

  async function save(form: IProductFormSchema) {
    if ((await create.execute(form)).ok) await router.push('/product')
  }
  return { save, saving: create.pending }
}
```

The action acts only on `result.ok`. For review-style workflows, carry the record's version or draft identity (`draftUuid`) on every save, and reload after each save ([data access → writes](data-access.md#writes-useapimutation)).

## Verify

- `pnpm --filter admin exec eslint .`, `pnpm --filter admin test`, and `pnpm --filter admin build`
- Add a `test/nuxt/<feature>-screens.test.ts` that answers through `fakeApi` and covers the model, a refused request, a contract error, and the requests each action sends ([testing](testing.md))
- In the browser: the list with data, empty, and with a failed request; creating, editing, and deleting a record; and page and filter changes, including Back
