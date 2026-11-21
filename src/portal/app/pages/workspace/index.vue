<script lang="ts">
import type { DocAIDTO } from '@/types/dto'
import type { WorkspaceCardItem } from '@/features/workspace/components/WorkspaceCard.vue'
</script>

<script lang="ts" setup>
import { UButton } from '#components'
import * as docaiService from '@/services/docai.service'
import * as glossaryService from '@/services/glossary.service'
import { useActivity } from '@/features/workspace/composables/useActivity'
import WorkspaceCard from '@/features/workspace/components/WorkspaceCard.vue'
import WorkspaceCardWrapper from '@/features/workspace/components/WorkspaceCardWrapper.vue'

const {
  open,
  query,
  pending,
  tableData,
  ASYNC_KEY,
  onHover,
  toDetail,
  useColumn,
  onBulkDeleteFile,
  transformActivityData,
} = useActivity()

const route = useRoute()
const profileStore = useProfileStore()
const { t } = useI18n()
useBalancePolling()

const columns = useColumn()

const { data: activityData, pending: activityPending, execute: activityExecute } = useAsyncData(ASYNC_KEY.history, async () => {
  const { data } = await docaiService.getActivitiesHistory({ companyId: profileStore.companyId }, query)
  return transformActivityData(data)
}, { lazy: true, watch: [query] })

const { data: processorData, pending: processorPending } = useAsyncData(ASYNC_KEY.processor, async () => {
  const { data } = await docaiService.getProcessors({ companyId: profileStore.companyId })
  return data
}, { lazy: true })

const { data: glossaryAvailable, pending: glossaryAvailabilityPending } = useAsyncData('glossary-availability', async () => {
  try {
    await glossaryService.getEntries(
      { companyId: profileStore.companyId },
      { page: 0, size: 1 },
    )
    return true
  }
  catch {
    return false
  }
}, { lazy: true })

const processorItems = computed(() => {
  if (!processorData.value) return []
  return processorData.value.map<WorkspaceCardItem>(o => ({
    to: o.type === 'POM_GLOSSARY' ? toRoute('/workspace/glossary') : toCreate(o.type),
    title: o.displayName,
    desc: o.description,
    status: 'ACTIVE',
  }))
})

function toCreate(type: DocAIDTO.DocType) {
  return toRoute('/workspace/create', `?type=${type}`)
}

const onSelect = toDetail(route.path)

function onDelete() {
  onBulkDeleteFile(activityExecute)
}

watch(activityData, (data) => {
  tableData.value = data ?? []
})

useHead({
  titleTemplate: 'Workspace - %s',
})
</script>

<template>
  <UDashboardPanel id="workspace">
    <template #header>
      <LayoutHeader
        :to="toRoute('/')"
        title="Back"
      />
    </template>

    <template #body>
      <LayoutContent>
        <LayoutHeading
          title="Doc AI Workspace"
          description="Extract, analyze, and generate data with Syncra AI."
        />

        <!-- <section
          v-if="glossaryAvailabilityPending || glossaryAvailable"
          class="relative isolate overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6"
        >
          <div class="pointer-events-none absolute -right-2 -top-8 select-none text-8xl font-black text-primary/[0.06]">
            术语
          </div>
          <div class="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-start gap-4">
              <USkeleton
                v-if="glossaryAvailabilityPending"
                class="size-12 rounded-xl"
              />
              <div
                v-else
                class="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-inverted shadow-sm"
              >
                <UIcon
                  name="lucide:languages"
                  class="size-6"
                />
              </div>
              <div class="max-w-xl">
                <USkeleton
                  v-if="glossaryAvailabilityPending"
                  class="h-6 w-48"
                />
                <h2
                  v-else
                  class="text-lg font-semibold text-highlighted"
                >
                  {{ t('glossary.launcher.title') }}
                </h2>
                <USkeleton
                  v-if="glossaryAvailabilityPending"
                  class="mt-2 h-4 w-full max-w-md"
                />
                <p
                  v-else
                  class="mt-1 text-sm leading-6 text-muted"
                >
                  {{ t('glossary.launcher.description') }}
                </p>
              </div>
            </div>
            <USkeleton
              v-if="glossaryAvailabilityPending"
              class="h-9 w-36"
            />
            <UButton
              v-else
              icon="lucide:arrow-up-right"
              :label="t('glossary.launcher.action')"
              :to="toRoute('/workspace/glossary')"
            />
          </div>
        </section> -->

        <LayoutWrapper title="Modules">
          <WorkspaceCardWrapper
            :pending-count="4"
            :pending="processorPending"
            :is-empty="processorItems.length === 0"
          >
            <WorkspaceCard :items="processorItems">
              <template #footer="{ item, statusProps }">
                <UButton
                  block
                  label="Open"
                  :color="statusProps.color"
                  :to="item.to"
                  :icon="item.status === 'ACTIVE' ? 'lucide:external-link' : 'lucide:mail'"
                />
              </template>
            </WorkspaceCard>
          </WorkspaceCardWrapper>
        </LayoutWrapper>

        <section>
          <UCard :ui="{ body: tw`p-0 sm:p-0` }">
            <template #header>
              <section class="flex items-center justify-between gap-4">
                <h1 class="text-lg font-semibold text-highlighted">
                  Recent Activities
                </h1>
              </section>
            </template>

            <UTable
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
              @hover="onHover"
            />

            <template #footer>
              <footer class="text-center">
                <UButton
                  icon="lucide:history"
                  label="See More"
                  color="neutral"
                  variant="outline"
                  :to="toRoute('/workspace/activity-history')"
                />
              </footer>
            </template>
          </UCard>
        </section>
      </LayoutContent>

      <ModalConfirmation
        v-model="open.delete"
        icon="lucide:info"
        color="error"
        title="Remove file from this Process?"
        description="You are about to remove this file! Processing details will remain the same."
        label-right="Remove"
        :loading="pending.delete"
        @right="onDelete"
      />
    </template>
  </UDashboardPanel>
</template>
