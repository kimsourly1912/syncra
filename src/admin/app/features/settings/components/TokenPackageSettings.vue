<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useTokenPackages } from '../composables/useTokenPackages'
import type { TokenPackage } from '../models/token-package'

const { packages, loading, refreshing, pending, error, refresh } = useTokenPackages()

const price = (item: TokenPackage) => formatMoney(item.price, item.currency)
const expiry = (days: number | null | undefined) => (days == null ? NO_VALUE : `${formatCount(days)} ${days === 1 ? 'day' : 'days'}`)

const NUMBER = { th: 'text-right', td: 'text-right tabular-nums' }
const columns: TableColumn<TokenPackage>[] = [
  { id: 'package', header: 'Package' },
  { id: 'tokens', header: 'Tokens', meta: { class: NUMBER }, cell: ({ row }) => formatCount(row.original.tokenAmount) },
  { id: 'price', header: 'Price', meta: { class: NUMBER }, cell: ({ row }) => price(row.original) },
  { id: 'expiry', header: 'Expires after', meta: { class: NUMBER }, cell: ({ row }) => expiry(row.original.expiryDays) },
]
</script>

<template>
  <UPageCard
    title="Token packages"
    description="The token packages customers can buy, in the order they're offered."
    variant="outline"
  >
    <AlertApiError
      v-if="error"
      :error="error"
      title="Could not load token packages"
      :retrying="pending"
      @retry="refresh"
    />
    <ListRefresh
      v-else
      :active="refreshing"
    >
      <!-- Tablet and up: a table. -->
      <UTable
        :data="packages"
        :columns
        :loading
        :ui="{ root: 'hidden md:block rounded-lg border border-default' }"
        aria-label="Token packages"
      >
        <template #package-cell="{ row }">
          <div class="min-w-0">
            <p class="flex items-baseline gap-2">
              <span class="font-medium text-highlighted">{{ row.original.name || 'Unnamed package' }}</span>
              <code
                v-if="row.original.code"
                class="text-xs text-muted"
              >{{ row.original.code }}</code>
            </p>
            <p
              v-if="row.original.description"
              class="max-w-sm truncate text-sm text-muted"
            >
              {{ row.original.description }}
            </p>
          </div>
        </template>
        <template #loading>
          <ListSkeleton label="Loading token packages…" />
        </template>
        <template #empty>
          <ListEmptyState
            noun="token packages"
            title="No token packages yet."
          />
        </template>
      </UTable>

      <!-- Phone: one card per package. -->
      <div class="md:hidden">
        <ListSkeleton
          v-if="loading"
          label="Loading token packages…"
        />
        <ListEmptyState
          v-else-if="!packages.length"
          noun="token packages"
          title="No token packages yet."
        />
        <ul
          v-else
          class="space-y-3"
          aria-label="Token packages"
        >
          <li
            v-for="item in packages"
            :key="item.id"
            class="rounded-lg border border-default p-3"
          >
            <p class="flex flex-wrap items-baseline gap-x-2">
              <span class="font-medium text-highlighted">{{ item.name || 'Unnamed package' }}</span>
              <code
                v-if="item.code"
                class="text-xs text-muted"
              >{{ item.code }}</code>
            </p>
            <p
              v-if="item.description"
              class="mt-1 line-clamp-2 text-sm text-muted"
            >
              {{ item.description }}
            </p>
            <dl class="mt-3 grid grid-cols-3 divide-x divide-default border-t border-default pt-3 text-center">
              <div class="min-w-0 px-1">
                <dt class="text-xs text-muted">
                  Tokens
                </dt>
                <dd class="truncate font-medium text-highlighted tabular-nums">
                  {{ formatCount(item.tokenAmount) }}
                </dd>
              </div>
              <div class="min-w-0 px-1">
                <dt class="text-xs text-muted">
                  Price
                </dt>
                <dd class="truncate font-medium text-highlighted tabular-nums">
                  {{ price(item) }}
                </dd>
              </div>
              <div class="min-w-0 px-1">
                <dt class="text-xs text-muted">
                  Expires
                </dt>
                <dd class="truncate font-medium text-highlighted tabular-nums">
                  {{ expiry(item.expiryDays) }}
                </dd>
              </div>
            </dl>
          </li>
        </ul>
      </div>
    </ListRefresh>

    <p class="flex items-center gap-2 text-sm text-muted">
      <UIcon
        name="lucide:info"
        class="size-4 shrink-0"
        aria-hidden="true"
      />
      Packages can't be changed in Admin.
    </p>
  </UPageCard>
</template>
