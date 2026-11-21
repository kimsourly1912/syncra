# Web data access

Web reads public catalog content and submits one public write: the Contact Sales inquiry. The shared service and DTO shapes are in [conventions](../../../docs/conventions.md#service-files).

## The client stack

| Piece | File | Notes |
| --- | --- | --- |
| `$api` | `app/plugins/api.ts` | `$fetch.create({ baseURL: apiURL })` with **no credentials**. `apiURL` comes from `NUXT_PUBLIC_API_URL`. |
| `useAPI<T>` | `app/composables/useAPI.ts` | A thin typed wrapper over `$api`. No refresh and no session. |
| Services | `services/module.service.ts` (`public/syncra-modules…`), `services/contact-sale.service.ts` (`/public-marketing/contact-sales/anonymouse`) | Public endpoints only |

## Reads

```ts
// Detail by route param: the key includes the param, and the read re-runs when it changes
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data, status, error, refresh } = useAsyncData(
  () => `marketing-content-${slug.value}`,
  async () => {
    const { data, success, reason } = await getMarketingContent(slug.value)
    if (!success) throw createError({ statusCode: 404, statusMessage: reason || 'Not found' })
    return data
  },
  { lazy: true },
)
```

- Include the route param in the key. Then going from product A to product B loads B; a fixed key doesn't ([known gap](architecture.md#known-gaps)).
- Render loading, content, and fallback separately. A missing product shows a fallback with a link back to `/products`, not a blank page.
- Set `useHead` from the loaded content. Watch `data` when the title depends on it, as `products/[slug].vue` does.
- `useModule()` loads the module list with `immediate: false`. The caller runs `moduleExecute()`. It handles both failure paths with `useToast()` directly. Copy that shape for other list reads.

## The Contact Sales write

`useContactSale()` owns the inquiry state: `open` (`contactSale`, `success`), `data`, `FIELD_NAME`, `pending`, `execute`, `submit`, and `clearAll`. `execute()` maps the form to `ContactSaleReq`: `phoneNumber` is `phoneCode + phone`, `agreedToContact` is `true`, and the unused fields are empty strings.

**The rule for any change to this flow:** show the success dialog only after a confirmed `success: true`.

```ts
async function execute() {
  pending.value = true
  try {
    const { success, reason } = await createContactSale(toContactSaleReq(data))
    if (!success) {
      toast.add({ title: 'Could not send your request', description: reason, color: 'error' })
      return false
    }
    return true
  }
  catch (err) {
    const e = err as FetchError
    toast.add({ title: 'Could not send your request', description: e.data?.reason ?? 'Please try again later.', color: 'error' })
    return false
  }
  finally {
    pending.value = false
  }
}

function submit(fn: () => void = noop) {
  return async (_: FormSubmitEvent<IContactSaleSchema>) => {
    if (!(await execute())) return     // keep the form open with its input
    onSuccess()
    fn()
  }
}
```

This is the target shape. Today's `submit()` calls `onSuccess()` unconditionally. Fix it when you change the flow, and test both outcomes ([testing](testing.md)). `toContactSaleReq` is the mapping now inline in `execute()`; pull it out into a pure function so it can be tested.

## Errors

Web uses Nuxt UI's `useToast()` directly. There's no app toast helper. Show the API `reason` when there is one, and a plain fallback otherwise. Never show stack traces or raw error objects to visitors.
