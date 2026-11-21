<script lang="ts" setup>
import { useInfiniteScroll, watchDebounced } from '@vueuse/core'
import * as docaiService from '@/services/docai.service'
import type { SatisticCardItem } from '~/components/app/SatisticCard.vue'
import { useActivity } from '@/features/workspace/composables/useActivity'
import { activityItems, moduleItems } from '@/features/workspace/data/workspace.data'

const {
  open,
  query,
  pending,
  tableData,
  ASYNC_KEY,
  toDetail,
  useColumn,
  onBulkDeleteFile,
  transformActivityData,
} = useActivity()

const route = useRoute()
const profileStore = useProfileStore()

initValue()

const columns = useColumn()
const search = shallowRef('')
const initPending = shallowRef(true)
const contentRef = useTemplateRef('content-ref')

const { data: activityData, pending: activityPending, execute: activityExecute } = useAsyncData(ASYNC_KEY.historyList, async () => {
  const { data } = await docaiService.getActivitiesHistory({ companyId: profileStore.companyId }, query)
  return {
    ...data,
    jobs: transformActivityData(data),
  }
}, { lazy: true, watch:
  [
    () => query.page,
    () => query.size,
    () => query.sortBy,
    () => query.status,
    () => query.docType,
    () => query.sortDirection,
  ],
})

const satisticItems = computed(() => {
  if (!activityData.value) return []
  const { completed, total, rejected } = activityData.value.statusCounts
  return [
    {
      label: 'Total Processing',
      count: total,
      icon: 'lucide:history',
      color: 'info',
    },
    {
      label: 'Completed',
      count: completed,
      icon: 'lucide:check',
      color: 'success',
    },
    {
      label: 'Rejected',
      count: rejected,
      icon: 'lucide:triangle-alert',
      color: 'error',
    },
  ] satisfies SatisticCardItem[]
})

const onSelect = toDetail(route.path)

function initValue() {
  query.size = 10
  query.docType = moduleItems[0]!.value
  query.status = activityItems[0]!.value
}

watch(activityData, (data) => {
  tableData.value = data?.jobs ?? []
  initPending.value = false
})

watchDebounced(() => query.search, () => {
  activityExecute()
}, { debounce: 500 })

onMounted(() => {
  const el = contentRef.value?.$el as HTMLElement
  useInfiniteScroll(el.parentElement, () => {
    query.size += 10
  },
  {
    canLoadMore() {
      const maxElement = activityData.value?.totalElements ?? -1
      return tableData.value.length < maxElement
    },
  },
  )
})

useHead({
  titleTemplate: 'Activity History - %s',
})
</script>

<template>
  <UDashboardPanel id="activity">
    <template #header>
      <LayoutHeader
        :to="toRoute('/workspace')"
        title="Back"
      />
    </template>

    <template #body>
      <LayoutContent ref="content-ref">
        <LayoutHeading
          title="Activity History"
          description=" View and manage all your document extraction activities"
        />

        <ul class="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
          <SatisticCard
            :items="satisticItems"
            :pending="initPending"
            :pending-count="5"
          />
        </ul>

        <LayoutWrapper title="All Activities">
          <UCard :ui="{ body: tw`p-0 sm:p-0`, header: tw`p-2.5 sm:px-2.5` }">
            <template #header>
              <section class="flex gap-4 sm:flex-row flex-col">
                <UInput
                  v-model="query.search"
                  icon="lucide:search"
                  placeholder="Search activities"
                  class="flex-1"
                />
                <USelect
                  v-model="query.status"
                  class="sm:w-44 w-full"
                  default-value="All Status"
                  :items="activityItems"
                />
                <USelect
                  v-model="query.docType"
                  class="sm:w-44 w-full"
                  default-value="All Modules"
                  :items="moduleItems"
                />
              </section>
            </template>

            <UTable
              ref="table-ref"
              v-model:global-filter="search"
              sticky
              :loading="activityPending"
              loading-animation="swing"
              :ui="{
                tr: 'group',
                th: tw`bg-elevated`,
                td: tw`cursor-pointer`,
              }"
              :columns
              :data="tableData"
              @select="onSelect"
            />

            <template
              v-if="activityPending"
              #footer
            >
              <section class="flex items-center justify-center">
                <UIcon
                  name="app:loading"
                  size="24"
                />
              </section>
            </template>
          </UCard>
        </LayoutWrapper>
      </LayoutContent>

      <ModalConfirmation
        v-model="open.delete"
        icon="lucide:info"
        color="error"
        title="Remove file from this Process?"
        description="You are about to remove this file! Processing details will remain the same."
        label-right="Remove"
        :loading="pending.delete"
        @right="onBulkDeleteFile(activityExecute)"
      />
    </template>
  </UDashboardPanel>
</template>
