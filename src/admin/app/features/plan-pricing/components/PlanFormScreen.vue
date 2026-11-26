<script setup lang="ts">
import { createReusableTemplate } from '@vueuse/core'
import type { Plan } from '../models/plan'

/**
 * New plan (no `plan`) or Edit plan. Static: there's no plan API yet (open question), so nothing is
 * saved. The fields keep what's typed and drive the preview; Create and Save stay disabled and say
 * why. The currency, billing type, and cycle choices are the ones the page already offered; what
 * they mean for billing is the API owner's to confirm.
 */
const props = defineProps<{
  plan?: Plan
}>()

const editing = computed(() => !!props.plan)
const SAVE_HINT = computed(() => (editing.value ? 'Saving plans isn\'t available yet.' : 'Creating plans isn\'t available yet.'))
const ACTION_HINT = 'Changing a plan\'s status isn\'t available yet.'

// The preview is drawn in two places: beside the form from `lg`, and in a modal below it.
const [DefinePreview, ReusePreview] = createReusableTemplate<{ bare?: boolean }>()
const previewOpen = ref(false)

const CURRENCIES = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'Riel (៛)', value: 'KHR' },
] as const
const BILLING_TYPES = ['Recurring', 'Monthly']
const CYCLES = [
  { label: 'Per month', value: 'month' },
  { label: 'Per year', value: 'year' },
] as const

const initial = () => ({
  name: props.plan?.name ?? '',
  description: props.plan?.description ?? '',
  currency: (props.plan?.currency ?? 'USD') as (typeof CURRENCIES)[number]['value'],
  amount: props.plan?.amount as number | undefined,
  prefix: props.plan?.prefix ?? '',
  billingType: props.plan?.billingType ?? 'Recurring',
  cycle: (props.plan?.cycle ?? 'month') as (typeof CYCLES)[number]['value'],
  listed: props.plan?.active ?? true,
})
const form = reactive(initial())

// Key features: each has a stable id, so removing one keeps the others' inputs and focus.
let nextFeatureId = 0
const startFeatures = () => {
  const texts = props.plan?.features.length ? props.plan.features : ['']
  return texts.map(text => ({ id: nextFeatureId++, text }))
}
const features = ref(startFeatures())

async function addFeature(after = features.value.length - 1) {
  const id = nextFeatureId++
  features.value.splice(after + 1, 0, { id, text: '' })
  await nextTick()
  document.getElementById(`plan-feature-${id}`)?.focus()
}
function removeFeature(index: number) {
  features.value.splice(index, 1)
  if (!features.value.length) features.value.push({ id: nextFeatureId++, text: '' })
}

// Unsaved changes: anything that differs from where the form started.
const featureTexts = (list: { text: string }[]) => list.map(feature => feature.text.trim()).filter(Boolean)
const dirty = computed(() => {
  const start = initial()
  return (Object.keys(start) as (keyof typeof start)[]).some(key => form[key] !== start[key])
    || featureTexts(features.value).join('\n') !== (props.plan?.features ?? []).join('\n')
})
function discardChanges() {
  Object.assign(form, initial())
  features.value = startFeatures()
}

const updated = computed(() => (props.plan ? formatAge(props.plan.updatedAt).age : undefined))
const previewPrice = computed(() => formatMoney(form.amount, form.currency))
const previewFeatures = computed(() => featureTexts(features.value))
</script>

<template>
  <UDashboardPanel class="page-narrow">
    <template #header>
      <UDashboardNavbar
        :title="editing ? 'Edit plan' : 'New plan'"
        :toggle="false"
      >
        <template #leading>
          <UButton
            icon="lucide:arrow-left"
            color="neutral"
            variant="ghost"
            to="/plan-pricing"
            aria-label="Back to plans"
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
            to="/plan-pricing"
            class="hidden sm:inline-flex"
          />
          <!-- A disabled button gets no pointer events, so the hint sits on this wrapper. Icon only on a phone. -->
          <span :title="SAVE_HINT">
            <UButton
              icon="lucide:check"
              disabled
              :aria-label="editing ? 'Save changes' : 'Create plan'"
              aria-describedby="plan-save-hint"
            >
              <span class="hidden sm:inline">{{ editing ? 'Save changes' : 'Create plan' }}</span>
            </UButton>
          </span>
          <span
            id="plan-save-hint"
            class="sr-only"
          >{{ SAVE_HINT }}</span>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- The plan's card on the Plan & Pricing page, as it would show there. -->
      <DefinePreview v-slot="{ bare }">
        <!-- Framed beside the form; bare in the modal, which has its own frame and padding. -->
        <div
          :class="bare ? '' : 'rounded-lg border border-default bg-elevated/40 p-4'"
        >
          <p
            class="font-semibold wrap-anywhere"
            :class="form.name.trim() ? 'text-highlighted' : 'text-dimmed'"
          >
            {{ form.name.trim() || 'Plan name' }}
          </p>
          <p
            class="mt-1 line-clamp-3 text-sm wrap-anywhere"
            :class="form.description.trim() ? 'text-muted' : 'text-dimmed'"
          >
            {{ form.description.trim() || 'A short description of the plan.' }}
          </p>
          <div class="mt-4">
            <p
              v-if="form.prefix.trim()"
              class="text-xs text-muted"
            >
              {{ form.prefix.trim() }}
            </p>
            <p class="flex items-baseline gap-1">
              <span
                class="text-2xl font-semibold tabular-nums"
                :class="form.amount == null ? 'text-dimmed' : 'text-highlighted'"
              >{{ previewPrice }}</span>
              <span class="text-sm text-muted">/ {{ form.cycle }}</span>
            </p>
          </div>
          <ul
            v-if="previewFeatures.length"
            class="mt-4 space-y-1.5 border-t border-default pt-3"
          >
            <li
              v-for="(feature, index) in previewFeatures"
              :key="index"
              class="flex items-start gap-2 text-sm"
            >
              <UIcon
                name="lucide:check"
                class="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span class="wrap-anywhere">{{ feature }}</span>
            </li>
          </ul>
          <p
            v-else
            class="mt-4 border-t border-default pt-3 text-sm text-dimmed"
          >
            Key features show here.
          </p>
          <div class="mt-3">
            <UBadge
              :label="form.listed ? 'Listed' : 'Hidden'"
              :icon="form.listed ? 'lucide:eye' : 'lucide:eye-off'"
              :color="form.listed ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
            />
          </div>
        </div>
      </DefinePreview>

      <!-- Editing: which plan, and a way back to where the form started. -->
      <div
        v-if="plan"
        class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
      >
        <p class="text-sm text-muted">
          <span class="font-medium text-highlighted">{{ plan.name }}</span>
          <span class="text-dimmed tabular-nums"> #{{ plan.id }}</span>
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
            title="Plan"
            description="The name and summary customers see."
            variant="outline"
          >
            <div class="space-y-5">
              <UFormField
                label="Name"
                name="name"
              >
                <UInput
                  v-model="form.name"
                  placeholder="e.g. Starter"
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
                  placeholder="Who the plan is for, in a sentence or two."
                  :rows="3"
                  autoresize
                  class="w-full"
                />
              </UFormField>
            </div>
          </UPageCard>

          <UPageCard
            title="Price"
            description="How the price reads on the Plan & Pricing page."
            variant="outline"
          >
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField
                label="Currency"
                name="currency"
              >
                <USelect
                  v-model="form.currency"
                  :items="[...CURRENCIES]"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Amount"
                name="amount"
              >
                <UInputNumber
                  v-model="form.amount"
                  :min="0"
                  :step="1"
                  :increment="false"
                  :decrement="false"
                  :format-options="{ style: 'currency', currency: form.currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 2 }"
                  placeholder="0"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Billing type"
                name="billingType"
              >
                <USelect
                  v-model="form.billingType"
                  :items="BILLING_TYPES"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Billing cycle"
                name="cycle"
              >
                <USelect
                  v-model="form.cycle"
                  :items="[...CYCLES]"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Price prefix"
                name="prefix"
                hint="Optional"
                description="Shown before the price, e.g. &quot;Starting from&quot;."
                class="sm:col-span-2"
              >
                <UInput
                  v-model="form.prefix"
                  placeholder="Starting from"
                  class="w-full"
                />
              </UFormField>
            </div>
          </UPageCard>

          <UPageCard
            title="Key features"
            description="Listed on the plan's card. Press Enter to add the next one."
            variant="outline"
          >
            <ol class="space-y-2">
              <li
                v-for="(feature, index) in features"
                :key="feature.id"
                class="flex items-center gap-2"
              >
                <span class="w-5 shrink-0 text-right text-sm text-dimmed tabular-nums">{{ index + 1 }}</span>
                <UInput
                  :id="`plan-feature-${feature.id}`"
                  v-model="feature.text"
                  placeholder="e.g. Automated document processing"
                  :aria-label="`Feature ${index + 1}`"
                  class="flex-1"
                  @keydown.enter.prevent="addFeature(index)"
                />
                <UButton
                  icon="lucide:x"
                  color="neutral"
                  variant="ghost"
                  :aria-label="`Remove feature ${index + 1}`"
                  :disabled="features.length === 1 && !feature.text"
                  @click="removeFeature(index)"
                />
              </li>
            </ol>
            <UButton
              label="Add feature"
              icon="lucide:plus"
              color="neutral"
              variant="outline"
              class="mt-3 self-start"
              @click="addFeature()"
            />
          </UPageCard>

          <UPageCard
            title="Visibility"
            variant="outline"
          >
            <div class="flex items-start justify-between gap-4">
              <label
                for="plan-listed"
                class="min-w-0 cursor-pointer"
              >
                <span class="block text-sm font-medium text-highlighted">Show on the Plan & Pricing page</span>
                <span class="block text-sm text-muted">Visitors see this plan in the website's pricing list.</span>
              </label>
              <USwitch
                id="plan-listed"
                v-model="form.listed"
                class="mt-0.5"
              />
            </div>
          </UPageCard>

          <!-- Editing only: actions on the whole plan, kept apart from the form. -->
          <UPageCard
            v-if="plan"
            title="Danger zone"
            variant="outline"
            :ui="{ root: 'ring-error/30' }"
          >
            <ul class="divide-y divide-default">
              <li class="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-highlighted">
                    {{ plan.active ? 'Deactivate this plan' : 'Activate this plan' }}
                  </p>
                  <p class="text-sm text-muted">
                    {{ plan.active ? 'Turn the plan off without deleting it.' : 'Turn the plan back on.' }}
                  </p>
                </div>
                <span :title="ACTION_HINT">
                  <UButton
                    :label="plan.active ? 'Deactivate' : 'Activate'"
                    color="neutral"
                    variant="outline"
                    disabled
                  />
                </span>
              </li>
              <li class="flex flex-wrap items-center justify-between gap-3 py-3 last:pb-0">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-highlighted">
                    Delete this plan
                  </p>
                  <p class="text-sm text-muted">
                    Remove the plan. This can't be undone.
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
        description="How the plan shows on the Plan & Pricing page. Saving isn't connected yet."
      >
        <template #body>
          <ReusePreview bare />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
