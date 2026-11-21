<script setup lang="ts">
import { activityFilter, typeItems } from '@/features/token/data'
import type { TokenItem } from '@/features/token/type'
import type { TransactionDto } from '@/types/dto/token'
import { getTokenTransactions } from '@/services/token.service'

type Query = TransactionDto.Query

const reqToken = useRequestToken()
const profileStore = useProfileStore()

const tokens = computed(() => {
  const { tokenBalance } = profileStore
  if (!tokenBalance) return ''
  return new Intl.NumberFormat('en-US').format(tokenBalance.balance)
})

const type = shallowRef(typeItems[0]!.value as string)

const query = computed(() => {
  return {
    size: 3,
    ...activityFilter(type.value),
  } satisfies Partial<Query>
})

const id = useId()

const { data, pending } = useAsyncData(`token-badge-transaction-${id}`, () => {
  return getTokenTransactions(profileStore.companyId, query.value)
}, { watch: [query] })

const items = computed(() => {
  const d = data.value?.data.items
  if (!d) return []
  return d.map<TokenItem>(o => ({
    value: '',
    type: o.type,
    email: o.email,
    amount: o.amount,
    fullName: o.fullName,
    createdAt: o.createdAt,
    description: o.description,
    moduleName: o.moduleName,
    activityName: o.activityName,
    imageUrl: o.imageUrl,
    activityDetail: o.activityDetail,
  }))
})

function getActivityLabel(o: TokenItem) {
  return [o.moduleName, o.activityName].filter(Boolean).join(' • ') || 'N/A'
}

function formatNumber(v: number) {
  const { format } = new Intl.NumberFormat('en-US', { signDisplay: 'exceptZero' })
  return format(v)
}
</script>

<template>
  <UPopover
    :content="{
      align: 'end',
    }"
    :ui="{
      content: 'w-96',
    }"
  >
    <section
      class="flex items-center gap-2 py-1 px-4 ring cursor-pointer ring-inset ring-primary/25 bg-primary/10 hover:bg-primary/15 transition-all rounded-xl"
    >
      <LogoBadge src="img/coin.png" />
      <div class="flex flex-col">
        <span class="text-xs text-muted">Tokens:</span>
        <span class="font-semibold text-sm">{{ tokens }}</span>
      </div>
    </section>

    <template #content="{ close }">
      <main>
        <section class="px-5 pt-5 space-y-4">
          <header class="flex items-center justify-between gap-4 flex-wrap">
            <h1 class="text-lg font-medium text-highlighted">
              Token usage
            </h1>
            <UButton
              icon="lucide:x"
              variant="ghost"
              color="neutral"
              @click="close"
            />
          </header>

          <section class="space-y-1.5 p-4 rounded-xl bg-primary/25">
            <span class="text-xs font-bold text-muted">CURRENT BALANCE</span>
            <h1 class="text-2xl font-medium text-highlighted">
              {{ tokens }}
              <span class="inline text-sm font-medium text-muted">
                Tokens
              </span>
            </h1>
          </section>

          <UButton
            label="+ Request tokens"
            block
            color="primary"
            @click="reqToken.setOpen('request', true)"
          />

          <h2 class="text-sm font-medium text-highlighted">
            Recent activity
          </h2>

          <UTabs
            v-model="type"
            :items="typeItems"
            :ui="{
              root: 'items-start',
              indicator: 'rounded-full',
              list: 'bg-transparent w-auto gap-2',
              trigger: 'rounded-full ring ring-default data-[state=active]:ring-transparent',
            }"
          />
        </section>

        <section class="px-5 pb-5 pt-2 max-h-96 h-full overflow-auto">
          <template v-if="pending">
            <ul class="space-y-2">
              <USkeleton
                v-for="i in 3"
                :key="i"
                class="h-8"
              />
            </ul>
          </template>

          <template v-else>
            <template v-if="items.length > 0">
              <ul class="divide-y divide-default">
                <li
                  v-for="(o, idx) in items"
                  :key="idx"
                  class="flex items-center justify-between gap-3 py-3.5"
                >
                  <Avatar
                    :src="o.imageUrl"
                    :alt="o.fullName || o.email || 'N'"
                    size="md"
                  />
                  <section class="space-y-1 grow min-w-0">
                    <h1 class="text-neutral font-medium truncate text-sm">
                      {{ getActivityLabel(o) }}
                    </h1>
                    <p class="text-xs text-muted  truncate">
                      {{ formatDate(o.createdAt) }} • {{ o.fullName || o.email || 'N/A' }}
                    </p>
                  </section>
                  <span :class="['text-sm font-medium shrink-0', o.amount >=0 ? 'text-success' : 'text-error']">{{ formatNumber(o.amount) }}</span>
                </li>
              </ul>
            </template>

            <template v-else>
              <UEmpty
                title="No token activity yet"
                description="Usage and top-ups will show up here."
              />
            </template>
          </template>
        </section>

        <footer class="flex justify-end px-5 py-3 border-t border-default">
          <UButton
            to="/token"
            label="View all activity"
            variant="link"
            color="primary"
            trailing-icon="lucide:arrow-right"
            @click="close"
          />
        </footer>
      </main>
    </template>
  </UPopover>
</template>
