<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import { formatTimeAgo } from '@vueuse/core'
import { SAMPLE_PLANS } from '@/features/plan-pricing'
import type { Plan } from '@/features/plan-pricing'

// Static page: sample rows until the plan API exists (open question). The navbar says so.
const plans = SAMPLE_PLANS

const price = (plan: Plan) => new Intl.NumberFormat(undefined, { style: 'currency', currency: plan.currency, maximumFractionDigits: 0 }).format(plan.amount)

const updated = (value: string) => {
  const date = new Date(value)
  return { age: formatTimeAgo(date), full: date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) }
}

// Only Edit leads anywhere (a placeholder page); the rest wait for the plan API.
const actions = (plan: Plan): DropdownMenuItem[][] => [
  [{ label: 'Edit', icon: 'lucide:pencil', to: `/plan-pricing/${plan.id}` }],
  [{ label: plan.active ? 'Deactivate' : 'Activate', icon: plan.active ? 'lucide:circle-pause' : 'lucide:circle-play', disabled: true }],
  [{ label: 'Delete', icon: 'lucide:trash-2', color: 'error', disabled: true }],
]

// Cells are the template's `#<id>-cell` slots.
const columns: TableColumn<Plan>[] = [
  { id: 'plan', header: 'Plan' },
  { id: 'price', header: 'Price' },
  { id: 'status', header: 'Status' },
  { id: 'updated', header: 'Updated' },
  { id: 'action', header: () => h('span', { class: 'sr-only' }, 'Actions'), meta: { class: { th: 'w-14', td: 'w-14 text-right' } } },
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        icon="lucide:tags"
        title="Plan & Pricing Management"
      >
        <template #right>
          <UBadge
            label="Sample data"
            color="neutral"
            variant="subtle"
            class="hidden sm:inline-flex"
          />
          <!-- Icon only on a phone, so the title keeps its room. -->
          <UButton
            icon="lucide:plus"
            to="/plan-pricing/create"
            aria-label="New plan"
          >
            <span class="hidden sm:inline">New plan</span>
          </UButton>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <!-- Static page: the search isn't wired to an API yet. -->
          <InputSearch
            placeholder="Search plans…"
            class="w-full sm:max-w-sm"
          />
        </template>
        <template #right>
          <p class="hidden text-sm whitespace-nowrap text-muted md:block">
            {{ plans.length }} plans
          </p>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <!-- Tablet and up: a table. -->
      <UTable
        :data="plans"
        :columns
        :column-pinning="{ right: ['action'] }"
        :ui="{ root: 'hidden md:block rounded-lg border border-default' }"
        aria-label="Plans"
      >
        <template #plan-cell="{ row }">
          <div class="min-w-0">
            <p class="flex items-baseline gap-2">
              <ULink
                :to="`/plan-pricing/${row.original.id}`"
                class="font-medium text-highlighted hover:text-primary"
              >
                {{ row.original.name }}
              </ULink>
              <span class="text-xs text-dimmed tabular-nums">#{{ row.original.id }}</span>
            </p>
            <p class="max-w-sm truncate text-sm text-muted">
              {{ row.original.description }}
            </p>
          </div>
        </template>

        <template #price-cell="{ row }">
          <p
            v-if="row.original.prefix"
            class="text-xs text-dimmed"
          >
            {{ row.original.prefix }}
          </p>
          <p class="whitespace-nowrap">
            <span class="font-medium text-highlighted tabular-nums">{{ price(row.original) }}</span>
            <span class="text-muted"> / {{ row.original.cycle }}</span>
          </p>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :label="row.original.active ? 'Active' : 'Inactive'"
            :color="row.original.active ? 'success' : 'neutral'"
            variant="subtle"
          />
        </template>

        <template #updated-cell="{ row }">
          <span
            class="whitespace-nowrap text-muted"
            :title="updated(row.original.updatedAt).full"
          >{{ updated(row.original.updatedAt).age }}</span>
        </template>

        <template #action-cell="{ row }">
          <UDropdownMenu
            :items="actions(row.original)"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="lucide:ellipsis-vertical"
              variant="ghost"
              color="neutral"
              :aria-label="`Actions for ${row.original.name}`"
            />
          </UDropdownMenu>
        </template>
      </UTable>

      <!-- Phone: one card per plan. -->
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted md:hidden">
        <UBadge
          label="Sample data"
          color="neutral"
          variant="subtle"
          size="sm"
          class="sm:hidden"
        />
        <span>{{ plans.length }} plans</span>
      </div>
      <ul
        class="space-y-3 md:hidden"
        aria-label="Plans"
      >
        <li
          v-for="plan in plans"
          :key="plan.id"
          class="flex gap-2 rounded-lg border border-default bg-default p-3"
        >
          <div class="min-w-0 flex-1 space-y-1.5">
            <p class="flex flex-wrap items-baseline gap-x-2">
              <ULink
                :to="`/plan-pricing/${plan.id}`"
                class="font-medium wrap-anywhere text-highlighted hover:text-primary"
              >
                {{ plan.name }}
              </ULink>
              <span class="text-xs text-dimmed tabular-nums">#{{ plan.id }}</span>
            </p>
            <p>
              <span
                v-if="plan.prefix"
                class="text-xs text-dimmed"
              >{{ plan.prefix }} </span>
              <span class="font-medium text-highlighted tabular-nums">{{ price(plan) }}</span>
              <span class="text-sm text-muted"> / {{ plan.cycle }}</span>
            </p>
            <p class="line-clamp-2 text-sm text-muted">
              {{ plan.description }}
            </p>
            <div class="flex flex-wrap items-center gap-1.5">
              <UBadge
                :label="plan.active ? 'Active' : 'Inactive'"
                :color="plan.active ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              />
              <span
                class="text-xs text-dimmed"
                :title="updated(plan.updatedAt).full"
              >Updated {{ updated(plan.updatedAt).age }}</span>
            </div>
          </div>

          <UDropdownMenu
            :items="actions(plan)"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="lucide:ellipsis-vertical"
              variant="ghost"
              color="neutral"
              class="-me-1 -mt-1 self-start"
              :aria-label="`Actions for ${plan.name}`"
            />
          </UDropdownMenu>
        </li>
      </ul>
    </template>
  </UDashboardPanel>
</template>
