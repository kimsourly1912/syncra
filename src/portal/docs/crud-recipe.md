# Portal CRUD recipe

This recipe adds a company-scoped resource with list, create, edit, and delete. **`suppliers` is not a real Syncra feature.** It shows the file layout and the code shape. Every helper it uses (`useAPI`, `buildEndPoint`, `useAppToast`, `useProfileStore`, `LayoutContent`, `ModalConfirmation`, `EmptyData`, `baseSchema`) is real. Before building a real resource, confirm its API contract ([feature standard](../../../docs/feature-standard.md#before-you-code)).

## Files

```text
app/types/dto/supplier.dto.ts                         1  API contract
app/types/dto/index.ts                                   + export * as SupplierDTO from './supplier.dto'
app/services/supplier.service.ts                      2  transport
app/features/suppliers/schemas/supplier-form.ts       3  schema + mapping
app/features/suppliers/composables/useSuppliers.ts    4  reads + actions
app/features/suppliers/components/SupplierFormModal.vue  5
app/features/suppliers/components/SupplierListScreen.vue 6
app/features/suppliers/index.ts                       7  only if another feature needs something
app/pages/suppliers/index.vue                         8  thin route
app/constants/route.ts, composables/usePermission.ts, layouts/default.vue   9  wiring
test/unit/supplier-form.test.ts, test/nuxt/suppliers.test.ts               10 tests
```

## 1. DTO

```ts
// app/types/dto/supplier.dto.ts
import type { BaseRes, PageRes } from './base.dto'

// Param
export interface SupplierParam { companyId: number, supplierId: number }
export type SupplierListParam = Pick<SupplierParam, 'companyId'>

// Query
export interface SupplierListQuery { page?: number, size?: number, search?: string }

// Data
export interface SupplierData { id: number, name: string, email: string, country: string }

// Request
export interface SupplierSaveReq { name: string, email: string, country: string }

// Response
export type SupplierRes = BaseRes<SupplierData>
export type SupplierListRes = BaseRes<PageRes<SupplierData>>
export type SupplierDeleteRes = BaseRes<null>
```

## 2. Service

```ts
// app/services/supplier.service.ts
import type { SupplierDTO } from '@/types/dto'

const ENDPOINT = {
  prefix: '/companies',
  parts: { suppliers: 'suppliers' },
} as const

type Parts = typeof ENDPOINT.parts

function supplierEndpoint(companyId: number, parts: Array<string | number> = []) {
  if (companyId <= 0) throw new Error('Supplier: companyId is required')
  return buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'suppliers', ...parts])
}

export function listSuppliers(param: SupplierDTO.SupplierListParam, query: SupplierDTO.SupplierListQuery = {}) {
  return useAPI<SupplierDTO.SupplierListRes>(supplierEndpoint(param.companyId), { method: 'GET', query })
}

export function createSupplier(param: SupplierDTO.SupplierListParam, req: SupplierDTO.SupplierSaveReq) {
  return useAPI<SupplierDTO.SupplierRes>(supplierEndpoint(param.companyId), { method: 'POST', body: req })
}

export function updateSupplier(param: SupplierDTO.SupplierParam, req: SupplierDTO.SupplierSaveReq) {
  return useAPI<SupplierDTO.SupplierRes>(supplierEndpoint(param.companyId, [param.supplierId]), { method: 'PATCH', body: req })
}

export function deleteSupplier(param: SupplierDTO.SupplierParam) {
  return useAPI<SupplierDTO.SupplierDeleteRes>(supplierEndpoint(param.companyId, [param.supplierId]), { method: 'DELETE' })
}
```

## 3. Schema and mapping

```ts
// app/features/suppliers/schemas/supplier-form.ts
import * as v from 'valibot'
import { baseSchema } from '@/schema/base.schema'
import type { SupplierDTO } from '@/types/dto'

export const supplierFormSchema = v.object({
  name: baseSchema.string,
  email: baseSchema.email,
  country: baseSchema.string,
})

export type ISupplierFormSchema = v.InferOutput<typeof supplierFormSchema>

export function emptySupplierForm(): ISupplierFormSchema {
  return { name: '', email: '', country: '' }
}

export function toSupplierForm(supplier: SupplierDTO.SupplierData): ISupplierFormSchema {
  const { name, email, country } = supplier
  return { name, email, country }
}

export function toSupplierSaveReq(data: ISupplierFormSchema): SupplierDTO.SupplierSaveReq {
  return { name: data.name.trim(), email: data.email.trim(), country: data.country }
}
```

## 4. Composable

```ts
// app/features/suppliers/composables/useSuppliers.ts
import * as supplierService from '@/services/supplier.service'
import type { SupplierDTO } from '@/types/dto'

interface SaveSupplierOptions {
  supplierId?: number
  req: SupplierDTO.SupplierSaveReq
}

export function useSuppliers() {
  const { toast } = useAppToast()
  const profileStore = useProfileStore()

  const query = reactive<SupplierDTO.SupplierListQuery>({ page: 0, size: 10, search: '' })
  const pending = reactive({ save: false, remove: false })

  const list = useAsyncData(
    () => `suppliers-${profileStore.companyId}`,
    async () => {
      const { data } = await supplierService.listSuppliers({ companyId: profileStore.companyId }, query)
      return data
    },
    { lazy: true, watch: [() => query.page, () => query.size] },
  )

  async function saveSupplier(options: SaveSupplierOptions) {
    const { supplierId, req } = options
    const companyId = profileStore.companyId
    pending.save = true
    try {
      const res = supplierId
        ? await supplierService.updateSupplier({ companyId, supplierId }, req)
        : await supplierService.createSupplier({ companyId }, req)
      if (!res.success) {
        toast.add('error', { title: `Could not save supplier "${req.name}"`, description: res.reason })
        return false
      }
      toast.add('success', { title: supplierId ? 'Supplier updated' : 'Supplier added', description: req.name })
      await list.refresh()
      return true
    }
    catch (e) {
      toast.addException(e)
      return false
    }
    finally {
      pending.save = false
    }
  }

  async function removeSupplier(supplier: SupplierDTO.SupplierData) {
    pending.remove = true
    try {
      const res = await supplierService.deleteSupplier({ companyId: profileStore.companyId, supplierId: supplier.id })
      if (!res.success) {
        toast.add('error', { title: `Could not delete "${supplier.name}"`, description: res.reason })
        return false
      }
      toast.add('success', { title: `Supplier "${supplier.name}" deleted` })
      const lastOnPage = list.data.value?.content.length === 1
      if (lastOnPage && (query.page ?? 0) > 0)
        query.page = (query.page ?? 0) - 1           // the watch reloads the previous page
      else
        await list.refresh()
      return true
    }
    catch (e) {
      toast.addException(e)
      return false
    }
    finally {
      pending.remove = false
    }
  }

  return { query, list, pending, saveSupplier, removeSupplier }
}
```

## 5. Form modal

```vue
<!-- app/features/suppliers/components/SupplierFormModal.vue -->
<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { SchemaToString } from '@/types/common'
import type { SupplierDTO } from '@/types/dto'
import { emptySupplierForm, supplierFormSchema, toSupplierForm, toSupplierSaveReq } from '../schemas/supplier-form'
import type { ISupplierFormSchema } from '../schemas/supplier-form'

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{ supplier: SupplierDTO.SupplierData | null, pending: boolean }>()
const emit = defineEmits<{ submit: [req: SupplierDTO.SupplierSaveReq] }>()

const state = reactive<ISupplierFormSchema>(emptySupplierForm())
const FIELD_NAME = { name: 'name', email: 'email', country: 'country' } satisfies SchemaToString<ISupplierFormSchema>

watch(open, (isOpen) => {
  if (isOpen) Object.assign(state, props.supplier ? toSupplierForm(props.supplier) : emptySupplierForm())
})

function onSubmit(event: FormSubmitEvent<ISupplierFormSchema>) {
  emit('submit', toSupplierSaveReq(event.data))
}
</script>

<template>
  <UModal v-model:open="open" :title="supplier ? 'Edit supplier' : 'Add supplier'" :dismissible="!pending">
    <template #body>
      <UForm :state :schema="supplierFormSchema" class="space-y-6" @submit="onSubmit">
        <UFormField label="Name" :name="FIELD_NAME.name" required>
          <UInput v-model="state.name" class="w-full" :disabled="pending" />
        </UFormField>
        <UFormField label="Email" :name="FIELD_NAME.email" required>
          <UInput v-model="state.email" type="email" class="w-full" :disabled="pending" />
        </UFormField>
        <UFormField label="Country" :name="FIELD_NAME.country" required>
          <UInput v-model="state.country" class="w-full" :disabled="pending" />
        </UFormField>
        <UButton type="submit" :label="supplier ? 'Save changes' : 'Add supplier'" :loading="pending" block />
      </UForm>
    </template>
  </UModal>
</template>
```

## 6. Screen

```vue
<!-- app/features/suppliers/components/SupplierListScreen.vue -->
<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import type { TableColumn } from '@nuxt/ui'
import type { SupplierDTO } from '@/types/dto'
import { UButton } from '#components'
import { useSuppliers } from '../composables/useSuppliers'
import SupplierFormModal from './SupplierFormModal.vue'

const { query, list, pending, saveSupplier, removeSupplier } = useSuppliers()
const { data, status, error, refresh } = list

const open = reactive({ form: false, confirm: false })
const selected = shallowRef<SupplierDTO.SupplierData | null>(null)

const rows = computed(() => data.value?.content ?? [])
const isFiltered = computed(() => Boolean(query.search))

function openForm(supplier: SupplierDTO.SupplierData | null) {
  selected.value = supplier
  open.form = true
}

function askRemove(supplier: SupplierDTO.SupplierData) {
  selected.value = supplier
  open.confirm = true
}

async function onSubmit(req: SupplierDTO.SupplierSaveReq) {
  if (await saveSupplier({ supplierId: selected.value?.id, req }))
    open.form = false
}

async function onConfirmRemove() {
  if (selected.value && await removeSupplier(selected.value))
    open.confirm = false
}

watchDebounced(() => query.search, () => {
  query.page = 0
  refresh()
}, { debounce: 500 })

const columns: TableColumn<SupplierDTO.SupplierData>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'country', header: 'Country' },
  {
    id: 'actions',
    cell: ({ row }) => h('div', { class: tw`flex justify-end gap-1` }, [
      h(UButton, { 'icon': 'lucide:pencil', 'variant': 'ghost', 'color': 'neutral', 'aria-label': `Edit ${row.original.name}`, 'onClick': () => openForm(row.original) }),
      h(UButton, { 'icon': 'lucide:trash-2', 'variant': 'ghost', 'color': 'error', 'aria-label': `Delete ${row.original.name}`, 'onClick': () => askRemove(row.original) }),
    ]),
  },
]
</script>

<template>
  <UDashboardPanel id="suppliers">
    <template #header>
      <LayoutHeader title="Suppliers" />
    </template>

    <template #body>
      <LayoutContent>
        <LayoutWrapper title="Suppliers" description="Companies that send you documents">
          <template #suffix>
            <UButton label="Add supplier" icon="lucide:plus" @click="openForm(null)" />
          </template>

          <UAlert v-if="error" color="error" title="Could not load suppliers" :description="error.message"
                  :actions="[{ label: 'Retry', onClick: () => refresh() }]" />

          <UCard v-else :ui="{ body: tw`p-0 sm:p-0` }">
            <template #header>
              <UInput v-model="query.search" icon="lucide:search" placeholder="Search suppliers" class="w-full sm:w-72" />
            </template>
            <EmptyData v-if="status === 'success' && !rows.length"
                       :title="isFiltered ? 'No suppliers match your search' : 'No suppliers yet'"
                       :description="isFiltered ? 'Try another name or email.' : 'Add a supplier to get started.'" />
            <UTable v-else :data="rows" :columns :loading="status === 'pending'" sticky />
          </UCard>
        </LayoutWrapper>
      </LayoutContent>
    </template>
  </UDashboardPanel>

  <SupplierFormModal v-model:open="open.form" :supplier="selected" :pending="pending.save" @submit="onSubmit" />

  <ModalConfirmation
    v-model="open.confirm"
    icon="lucide:trash-2"
    color="error"
    :title="`Delete ${selected?.name ?? 'supplier'}?`"
    description="This removes the supplier for everyone in your company."
    label-right="Delete"
    :loading="pending.remove"
    @right="onConfirmRemove"
  />
</template>
```

To add paging, put a `UPagination` under the table, bound to `query.page + 1` and `data.totalElements`, and convert the page back to zero-based when it changes.

## 7. Public API (optional)

Create `app/features/suppliers/index.ts` only when another feature needs something, such as a picker:

```ts
export { default as SupplierSelect } from './components/SupplierSelect.vue'
export type { SupplierOption } from './types'
```

Never export `SupplierListScreen` or `SupplierFormModal` ([0002](../../../docs/decisions/0002-feature-folders-and-public-api.md)).

## 8. Route

```vue
<!-- app/pages/suppliers/index.vue -->
<script setup lang="ts">
import SupplierListScreen from '@/features/suppliers/components/SupplierListScreen.vue'
</script>

<template>
  <SupplierListScreen />
</template>
```

## 9. Wiring

- Add `suppliers: '/suppliers'` to `ROUTE_PRIVATE` in `app/constants/route.ts`. That generates the `auth` route rule and makes `toRoute('/suppliers')` type-check.
- Operator access: add `'/suppliers'` to `OPERATOR.routes` in `usePermission.ts` **only if an approved rule says so**. If you add a permission subject (`'suppliers'`), give it the approved actions for each role.
- Sidebar: add an entry to `menuItems` in `layouts/default.vue`. Wrap it in `profileStore.isAdmin && { … }` if only Admins should see it.

## 10. Tests

- `test/unit/supplier-form.test.ts`: `toSupplierSaveReq` trims fields, and `toSupplierForm` round-trips.
- `test/nuxt/suppliers.test.ts`: mock `useAPI` and `useAppToast` with `mockNuxtImport` ([testing](testing.md)). Check that:
  - `saveSupplier` returns `false` and shows an error for a `success: false` response
  - it returns `false` and calls `addException` for a thrown error
  - it refreshes and returns `true` on success
  - `removeSupplier` steps back a page when it deletes the last row on that page

## Done

Work through the [definition of done](../../../docs/feature-standard.md#definition-of-done): lint, tests, a browser check as Admin and Operator, the UI review checklist, and updates to the product scope and screen map.
