<script setup lang="ts">
import { createReusableTemplate, useObjectUrl } from '@vueuse/core'
import type { Product } from '../fixtures/products'

/**
 * New product (no `product`) or Edit product. Static: there's no product API yet (open question),
 * so nothing is saved. The fields keep what's typed and drive the preview; Create and Save stay
 * disabled and say why.
 */
const props = defineProps<{
  product?: Product
}>()

const editing = computed(() => !!props.product)
const SAVE_HINT = computed(() => (editing.value ? 'Saving products isn\'t available yet.' : 'Creating products isn\'t available yet.'))
const ACTION_HINT = 'Changing a product\'s status isn\'t available yet.'

// The preview is drawn in two places: beside the form from `lg`, and in a modal below it.
const [DefinePreview, ReusePreview] = createReusableTemplate<{ bare?: boolean }>()
const previewOpen = ref(false)

const initial = () => ({
  name: props.product?.name ?? '',
  description: props.product?.description ?? '',
  listed: props.product?.active ?? true,
  comingSoon: props.product ? !props.product.detailLive : false,
})
const form = reactive(initial())

// The icon: a new file replaces the product's current one. Checked here for the stated type and
// size; the server would have the final say.
const ICON_TYPES = ['image/png', 'image/svg+xml']
const ICON_MAX_BYTES = 1024 * 1024
const icon = ref<File | null>(null)
const currentIcon = ref(props.product?.icon ?? null)
const iconError = ref('')
const uploadedUrl = useObjectUrl(icon)
const iconUrl = computed(() => uploadedUrl.value ?? currentIcon.value ?? undefined)

watch(icon, (file) => {
  iconError.value = ''
  if (!file) return
  if (!ICON_TYPES.includes(file.type)) iconError.value = 'Choose a PNG or SVG file.'
  else if (file.size > ICON_MAX_BYTES) iconError.value = 'The icon must be 1 MB or smaller.'
  if (iconError.value) icon.value = null
})

function removeIcon(removeFile: () => void) {
  if (icon.value) removeFile()
  else currentIcon.value = null
}

// Unsaved changes: anything that differs from where the form started.
const dirty = computed(() => {
  const start = initial()
  return !!icon.value
    || currentIcon.value !== (props.product?.icon ?? null)
    || (Object.keys(start) as (keyof typeof start)[]).some(key => form[key] !== start[key])
})
function discardChanges() {
  Object.assign(form, initial())
  icon.value = null
  currentIcon.value = props.product?.icon ?? null
  iconError.value = ''
}

const updated = computed(() => (props.product ? formatAge(props.product.updatedAt).age : undefined))
const previewName = computed(() => form.name.trim() || 'Product name')
const previewDescription = computed(() => form.description.trim() || 'A short description of the product.')

const VISIBILITY = [
  {
    key: 'listed',
    label: 'Show on the Products page',
    description: 'Visitors see this product in the product list on the website.',
  },
  {
    key: 'comingSoon',
    label: 'Coming soon',
    description: 'The product\'s page shows "Coming soon" instead of its details.',
  },
] as const
</script>

<template>
  <UDashboardPanel class="page-narrow">
    <template #header>
      <UDashboardNavbar
        :title="editing ? 'Edit product' : 'New product'"
        :toggle="false"
      >
        <template #leading>
          <UButton
            icon="lucide:arrow-left"
            color="neutral"
            variant="ghost"
            to="/product"
            aria-label="Back to products"
          />
        </template>
        <template #right>
          <!-- Below `lg` the preview isn't beside the form; this opens it. -->
          <UButton
            icon="lucide:eye"
            color="neutral"
            variant="outline"
            aria-label="Preview"
            class="lg:hidden"
            @click="previewOpen = true"
          >
            <span class="hidden sm:inline">Preview</span>
          </UButton>
          <UBadge
            :label="editing ? 'Sample data' : 'Not connected'"
            color="neutral"
            variant="subtle"
            class="hidden sm:inline-flex"
          />
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            to="/product"
            class="hidden sm:inline-flex"
          />
          <!-- A disabled button gets no pointer events, so the hint sits on this wrapper. -->
          <!-- Icon only on a phone, so the title keeps its room. -->
          <span :title="SAVE_HINT">
            <UButton
              icon="lucide:check"
              disabled
              :aria-label="editing ? 'Save changes' : 'Create product'"
              aria-describedby="product-save-hint"
            >
              <span class="hidden sm:inline">{{ editing ? 'Save changes' : 'Create product' }}</span>
            </UButton>
          </span>
          <span
            id="product-save-hint"
            class="sr-only"
          >{{ SAVE_HINT }}</span>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- The product list's card, as the product would show there. -->
      <DefinePreview v-slot="{ bare }">
        <!-- Framed beside the form; bare in the modal, which has its own frame and padding. -->
        <div :class="bare ? '' : 'rounded-lg border border-default bg-elevated/40 p-4'">
          <div class="flex items-start gap-3">
            <span class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
              <img
                v-if="iconUrl"
                :src="iconUrl"
                alt=""
                class="size-8 object-contain"
              >
              <UIcon
                v-else
                name="lucide:package"
                class="size-6 text-dimmed"
              />
            </span>
            <div class="min-w-0 space-y-1">
              <p
                class="font-medium wrap-anywhere"
                :class="form.name.trim() ? 'text-highlighted' : 'text-dimmed'"
              >
                {{ previewName }}
              </p>
              <p
                class="line-clamp-3 text-sm wrap-anywhere"
                :class="form.description.trim() ? 'text-muted' : 'text-dimmed'"
              >
                {{ previewDescription }}
              </p>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-1.5 border-t border-default pt-3">
            <UBadge
              :label="form.listed ? 'Listed' : 'Hidden'"
              :icon="form.listed ? 'lucide:eye' : 'lucide:eye-off'"
              :color="form.listed ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
            />
            <UBadge
              :label="form.comingSoon ? 'Coming soon' : 'Detail page live'"
              :icon="form.comingSoon ? 'lucide:clock' : 'lucide:globe'"
              :color="form.comingSoon ? 'neutral' : 'primary'"
              :variant="form.comingSoon ? 'outline' : 'subtle'"
              size="sm"
            />
          </div>
        </div>
      </DefinePreview>

      <!-- Editing: which product, and a way back to where the form started. -->
      <div
        v-if="product"
        class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
      >
        <p class="text-sm text-muted">
          <span class="font-medium text-highlighted">{{ product.name }}</span>
          <span class="text-dimmed tabular-nums"> #{{ product.id }}</span>
          · Updated {{ updated }}
        </p>
        <div
          v-if="dirty"
          class="flex items-center gap-2"
          role="status"
        >
          <UBadge
            label="Unsaved changes"
            icon="lucide:circle-dot"
            color="warning"
            variant="subtle"
          />
          <UButton
            label="Discard changes"
            icon="lucide:undo-2"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="discardChanges"
          />
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <div class="space-y-6">
          <UPageCard
            title="Listing"
            description="How the product appears in the product list."
            variant="outline"
          >
            <div class="space-y-5">
              <UFormField
                label="Icon"
                name="icon"
                description="PNG or SVG, up to 1 MB. 64 × 64 px works best."
                :error="iconError || undefined"
              >
                <UFileUpload
                  v-slot="{ open, removeFile }"
                  v-model="icon"
                  accept="image/png,image/svg+xml"
                  class="mt-1"
                >
                  <div class="flex items-center gap-4">
                    <button
                      type="button"
                      class="flex size-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-accented bg-elevated/50 transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary"
                      :aria-label="iconUrl ? 'Replace icon' : 'Upload icon'"
                      @click="open()"
                    >
                      <img
                        v-if="iconUrl"
                        :src="iconUrl"
                        alt=""
                        class="size-10 object-contain"
                      >
                      <UIcon
                        v-else
                        name="lucide:image-plus"
                        class="size-6 text-muted"
                      />
                    </button>
                    <div class="flex flex-wrap gap-2">
                      <UButton
                        :label="iconUrl ? 'Replace' : 'Upload icon'"
                        icon="lucide:upload"
                        color="neutral"
                        variant="outline"
                        @click="open()"
                      />
                      <UButton
                        v-if="iconUrl"
                        label="Remove"
                        color="error"
                        variant="ghost"
                        @click="removeIcon(removeFile)"
                      />
                    </div>
                  </div>
                </UFileUpload>
              </UFormField>

              <UFormField
                label="Name"
                name="name"
              >
                <UInput
                  v-model="form.name"
                  placeholder="e.g. Doc AI"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Description"
                name="description"
                hint="Shown under the name"
              >
                <UTextarea
                  v-model="form.description"
                  placeholder="What the product does, in a sentence or two."
                  :rows="3"
                  autoresize
                  class="w-full"
                />
              </UFormField>
            </div>
          </UPageCard>

          <UPageCard
            title="Visibility"
            description="Where visitors can see the product."
            variant="outline"
          >
            <ul class="divide-y divide-default">
              <li
                v-for="item in VISIBILITY"
                :key="item.key"
                class="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <label
                  :for="`product-${item.key}`"
                  class="min-w-0 cursor-pointer"
                >
                  <span class="block text-sm font-medium text-highlighted">{{ item.label }}</span>
                  <span class="block text-sm text-muted">{{ item.description }}</span>
                </label>
                <USwitch
                  :id="`product-${item.key}`"
                  v-model="form[item.key]"
                  class="mt-0.5"
                />
              </li>
            </ul>
          </UPageCard>

          <!-- Editing only: actions on the whole product, kept apart from the form. -->
          <UPageCard
            v-if="product"
            title="Danger zone"
            variant="outline"
            :ui="{ root: 'ring-error/30' }"
          >
            <ul class="divide-y divide-default">
              <li class="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-highlighted">
                    {{ product.active ? 'Deactivate this product' : 'Activate this product' }}
                  </p>
                  <p class="text-sm text-muted">
                    {{ product.active ? 'Turn the product off without deleting it.' : 'Turn the product back on.' }}
                  </p>
                </div>
                <span :title="ACTION_HINT">
                  <UButton
                    :label="product.active ? 'Deactivate' : 'Activate'"
                    color="neutral"
                    variant="outline"
                    disabled
                  />
                </span>
              </li>
              <li class="flex flex-wrap items-center justify-between gap-3 py-3 last:pb-0">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-highlighted">
                    Delete this product
                  </p>
                  <p class="text-sm text-muted">
                    Remove the product. This can't be undone.
                  </p>
                </div>
                <span :title="ACTION_HINT">
                  <UButton
                    label="Delete"
                    icon="lucide:trash-2"
                    color="error"
                    variant="outline"
                    disabled
                  />
                </span>
              </li>
            </ul>
          </UPageCard>
        </div>

        <!-- Beside the form from lg, following the page; below lg the navbar's Preview opens it. -->
        <aside
          class="hidden space-y-2 lg:sticky lg:top-0 lg:block"
          aria-label="Preview"
        >
          <p class="text-sm font-medium text-highlighted">
            Preview
          </p>
          <ReusePreview />
          <p class="text-xs text-dimmed">
            Saving isn't connected yet, so this preview is all that changes.
          </p>
        </aside>
      </div>

      <UModal
        v-model:open="previewOpen"
        title="Preview"
        description="How the product shows in the product list. Saving isn't connected yet."
      >
        <template #body>
          <ReusePreview bare />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
