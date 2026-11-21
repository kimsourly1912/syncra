<script setup lang="ts">
import { UBadge, Avatar } from '#components'
import { activityFilter, typeItems } from '@/features/token/data'
import type { Type } from '@/features/token/type'
import type { TableColumn, SelectMenuItem } from '@nuxt/ui'
import type { DateRange } from '@/components/date/DateRangePicker.vue'
import { getTokenTransactions } from '@/services/token.service'
import type { TransactionDto } from '@/types/dto/token'
import { getTeamMembers } from '@/services/team-management.service'

type Query = TransactionDto.Query

interface SummaryItem {
  label: string
  color: string
  value: string
}

interface TableData {
  id: string
  date: string
  type: Type
  name: string
  email: string
  amount: number
  status: string
  moduleName: string
  completedAt: string
  activityName: string
  description: string
  imageUrl: string
  activityDetail: string
}

interface FilterItem {
  type: string
  page: number
  teamId?: number
}

const id = useId()
const reqToken = useRequestToken()
const profileStore = useProfileStore()

const itemPerPage = 10

const date = shallowRef<DateRange>({
  end: undefined,
  start: undefined,
})

const filter = reactive<FilterItem>({
  page: 1,
  type: 'ALL',
  teamId: undefined,
})

function clearTeamId() {
  filter.teamId = undefined
}

const query = computed(() => {
  const end = date.value.end
  const start = date.value.start
  const initiatorUserId = filter.teamId
  return {
    ...activityFilter(filter.type),
    initiatorUserId,
    size: itemPerPage,
    page: filter.page - 1,
    to: end ? end.toString() : '',
    from: start ? start.toString() : '',
  } satisfies Partial<Query>
})

const { data, pending } = useAsyncData(`token-transaction-${id}`, () => {
  return getTokenTransactions(profileStore.companyId, query.value)
}, { watch: [query] })

const { data: teamData, pending: teamPending } = useAsyncData('token-team-members', () => {
  return getTeamMembers({ companyId: profileStore.companyId })
})

const tableData = computed(() => {
  const d = data.value?.data.items
  if (!d) return []
  return d.map<TableData>(o => ({
    id: o.uuid,
    type: o.type,
    email: o.email,
    name: o.fullName,
    status: o.status,
    amount: o.amount,
    date: o.createdAt,
    completedAt: o.completedAt,
    description: o.description,
    moduleName: o.moduleName,
    activityName: o.activityName,
    imageUrl: o.imageUrl,
    activityDetail: o.activityDetail,
  }))
})

const detail = reactive({
  open: false,
  item: null as TableData | null,
})

function openDetail(row: TableData) {
  detail.item = row
  detail.open = true
}

const columns: TableColumn<TableData>[] = [
  {
    accessorKey: 'date',
    header: 'DATE & TIME',
    cell({ row }) {
      return formatDateTime(row.original.date)
    },
  },
  {
    accessorKey: 'type',
    header: 'TYPE',
    cell({ row }) {
      const consumed = row.original.amount < 0
      return h(UBadge, {
        label: consumed ? 'Consumed' : 'Received',
        color: consumed ? 'neutral' : 'success',
        variant: 'soft',
      })
    },
  },
  {
    id: 'description',
    header: 'DESCRIPTION',
    cell({ row }) {
      const { moduleName, activityName } = row.original
      const label = [moduleName, activityName].filter(Boolean).join(' • ') || 'N/A'
      return h('section', {
        class: tw`cursor-pointer`,
        onClick: () => openDetail(row.original),
      }, [
        h('h1', { class: tw`text-highlighted text-xs lg:text-sm font-medium hover:underline` }, label),
        h('span', { class: tw`text-xs text-muted` }, row.original.activityDetail),
      ])
    },
  },
  {
    id: 'name',
    header: 'BY',
    cell({ row }) {
      const { name, email, imageUrl } = row.original
      const alt = name || email || 'N/A'
      const text = name || email ? undefined : 'NA'
      return h('section', { class: tw`flex items-center gap-3` }, [
        h(Avatar, { src: imageUrl, alt, text, size: '2xl' }),
        h('section', { class: tw`space-y-0.5` }, [
          h('h1', { class: tw`text-xs lg:text-sm font-medium text-highlighted` }, name || email || 'N/A'),
          h('span', { class: tw`text-xs text-muted` }, name ? email : ''),
        ]),
      ])
    },
  },
  {
    accessorKey: 'amount',
    header: 'AMOUNT',
    cell({ row }) {
      const { amount } = row.original
      const color = amount >= 0 ? tw`text-success` : tw`text-error`
      return h('span', { class: tw`font-medium ${color}` }, formatNumber(row.original.amount, true))
    },
  },
]

const summaryItems = computed(() => {
  const balance = profileStore.tokenBalance?.balance ?? 0
  return [
    {
      label: 'CURRENT BALANCE',
      color: tw`text-highlighted`,
      value: formatNumber(balance),
    },
  ] satisfies SummaryItem[]
})

const teamItems = computed(() => {
  const d = teamData.value?.data
  if (!d) return []
  return d.map<SelectMenuItem>((o) => {
    const label = o.fullName ?? o.email ?? ''
    const alt = o.fullName ?? o.email ?? ''
    return {
      label,
      value: o.id,
      description: o.fullName ? o.email : '',
      avatar: { src: '', alt, text: getInitials(alt), size: 'xl', ui: { fallback: tw`text-xs` } },
    }
  }) satisfies SelectMenuItem[]
})

const consumedTokens = computed(() => formatNumber(data.value?.data.totalDebited ?? 0))

const paginationSummary = computed(() => {
  const total = data.value?.data.totalElements ?? 0
  if (total === 0) return 'Showing 0 of 0 transactions'
  const start = (filter.page - 1) * itemPerPage + 1
  const end = Math.min(filter.page * itemPerPage, total)
  return `Showing ${start}–${end} of ${total} transactions`
})

function formatNumber(v: number, sign: boolean = false) {
  const { format } = new Intl.NumberFormat('en-US', { signDisplay: sign ? 'exceptZero' : 'auto' })
  return format(v)
}

function formatDateTime(v: string) {
  const { format } = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return format(new Date(v))
}

function getStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'FAILED':
    case 'REVERSED':
      return 'error'
    case 'PENDING':
      return 'warning'
    default:
      return 'neutral'
  }
}

watch(() => [
  date.value,
  filter.type,
  filter.teamId,
], () => {
  filter.page = 1
})
</script>

<template>
  <UDashboardPanel id="token">
    <template #header>
      <LayoutHeader title="Tokens" />
    </template>
    <template #body>
      <LayoutContent>
        <LayoutWrapper
          title="Token balance"
          description="Your team's available tokens and activity."
        >
          <template #suffix>
            <UButton
              label="Request more tokens"
              icon="lucide:plus"
              @click="reqToken.setOpen('request', true)"
            />
          </template>

          <ul class="grid grid-cols-1  gap-3 min-h-32">
            <li
              v-for="(o, idx) in summaryItems"
              :key="idx"
              class="relative overflow-hidden p-4 bg-linear-to-r from-[#19373E] to-[#1F4A4E] border border-default transition-all rounded-lg flex flex-col items-start justify-center text-left"
            >
              <span class="absolute -right-2.5 -top-50 w-100 h-100 rounded-full border border-white/10" />
              <span class="absolute right-7 -top-[188px] -translate-y-1 w-74 h-74 rounded-full border border-white/10" />

              <h1 class="text-sm text-white space mb-3 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-success border border-success inline-block" />
                {{ o.label }}
              </h1>
              <h1 :class="['text-2xl lg:text-3xl font-medium text-white', o.color]">
                {{ o.value }}
                <p class="inline text-sm text-white">
                  Tokens
                </p>
              </h1>
            </li>
          </ul>
        </LayoutWrapper>

        <LayoutWrapper title="Token activity">
          <template #suffix>
            <section class="flex items-center gap-4 flex-wrap">
              <section class="flex flex-col">
                <span class="text-sm text-muted">Consumed</span>
                <span class=" ml-1 font-medium text-error">{{ consumedTokens }}
                  <span class="text-sm text-muted">tokens</span>
                </span>
              </section>
              <USeparator
                orientation="vertical"
                class="h-5 hidden sm:block"
              />
              <section class="flex items-center gap-2">
                <span class="text-sm text-muted">Activity period</span>
                <DateRangePicker v-model="date" />
              </section>
            </section>
          </template>

          <UCard :ui="{ body: tw`p-0 sm:p-0`, header: tw`p-2.5 sm:px-2.5` }">
            <template #header>
              <section class="flex gap-4 flex-wrap justify-between">
                <UTabs
                  v-model="filter.type"
                  :items="typeItems"
                  :ui="{
                    list: 'bg-transparent gap-2',
                    indicator: 'rounded-full',
                    trigger: 'rounded-full ring ring-default data-[state=active]:ring-transparent',
                  }"
                />

                <section class="flex items-center gap-2">
                  <USelectMenu
                    v-model="filter.teamId"
                    :items="teamItems"
                    value-key="value"
                    :loading="teamPending"
                    class="w-36 h-8"
                    placeholder="Team member"
                    :ui="{ content: 'w-64', item: tw`items-center` }"
                  />
                  <UButton
                    v-if="filter.teamId"
                    color="neutral"
                    variant="ghost"
                    icon="lucide:x"
                    aria-label="Clear team member filter"
                    @click="clearTeamId"
                  />
                </section>
              </section>
            </template>

            <UTable
              :data="tableData"
              :columns="columns"
              :loading="pending"
              :ui="{
                th: tw`px-2 py-2 text-xs lg:px-4 lg:py-3.5 lg:text-sm`,
                td: tw`p-2 text-xs lg:p-4 lg:text-sm`,
              }"
            />

            <template #footer>
              <section class="flex items-center justify-between gap-4 flex-wrap overflow-x-auto">
                <span class="text-sm text-muted">{{ paginationSummary }}</span>
                <UPagination
                  v-model:page="filter.page"
                  :items-per-page="itemPerPage"
                  :total="data?.data.totalElements ?? 0"
                />
              </section>
            </template>
          </UCard>
        </LayoutWrapper>

        <ModalContent v-model="detail.open">
          <template #default="{ close }">
            <section
              v-if="detail.item"
              class="space-y-4"
            >
              <header class="flex items-center justify-between gap-4">
                <h1 class="text-lg font-medium text-highlighted">
                  Activity detail
                </h1>
                <UButton
                  icon="lucide:x"
                  variant="ghost"
                  color="neutral"
                  @click="close"
                />
              </header>

              <section class="flex items-center gap-3">
                <Avatar
                  :src="detail.item.imageUrl"
                  :alt="detail.item.name || detail.item.email || 'N'"
                  size="2xl"
                />
                <section class="space-y-0.5">
                  <h1 class="text-sm font-medium text-highlighted">
                    {{ detail.item.name || detail.item.email || 'N/A' }}
                  </h1>
                  <span
                    v-if="detail.item.name"
                    class="text-xs text-muted"
                  >{{ detail.item.email }}</span>
                </section>
              </section>

              <ul class="divide-y divide-default text-sm">
                <li class="flex items-center justify-between py-2.5">
                  <span class="text-muted">Description</span>
                  <span class="font-medium text-highlighted">{{ detail.item.description }}</span>
                </li>
                <li class="flex items-center justify-between py-2.5">
                  <span class="text-muted">Type</span>
                  <UBadge
                    :label="detail.item.amount < 0 ? 'Consumed' : 'Received'"
                    :color="detail.item.amount < 0 ? 'neutral' : 'success'"
                    variant="soft"
                  />
                </li>
                <li class="flex items-center justify-between py-2.5">
                  <span class="text-muted">Status</span>
                  <UBadge
                    :label="detail.item.status"
                    :color="getStatusColor(detail.item.status)"
                    variant="soft"
                  />
                </li>
                <li class="flex items-center justify-between py-2.5">
                  <span class="text-muted">Amount</span>
                  <span :class="['font-medium', detail.item.amount >= 0 ? 'text-success' : 'text-error']">{{ formatNumber(detail.item.amount, true) }}</span>
                </li>
                <li class="flex items-center justify-between py-2.5">
                  <span class="text-muted">Date</span>
                  <span class="font-medium text-highlighted">{{ formatDate(detail.item.date) }}</span>
                </li>
                <li
                  v-if="detail.item.completedAt"
                  class="flex items-center justify-between py-2.5"
                >
                  <span class="text-muted">Completed at</span>
                  <span class="font-medium text-highlighted">{{ formatDate(detail.item.completedAt) }}</span>
                </li>
                <li class="flex items-center justify-between py-2.5">
                  <span class="text-muted">Reference</span>
                  <span class="font-medium text-highlighted">{{ detail.item.id }}</span>
                </li>
              </ul>
            </section>
          </template>
        </ModalContent>
      </LayoutContent>
    </template>
  </UDashboardPanel>
</template>
