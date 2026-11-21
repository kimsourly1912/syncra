<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import type { NuxtUIColor } from '~/types/nuxt-ui'

export type WorkspaceCardStatus = 'PROGRESS' | 'ACTIVE' | 'SUBMITTED' | 'INACTIVE'

interface WorkspaceCardStatusItem {
  label: string
  color: NuxtUIColor
}

export interface WorkspaceCardItem {
  img?: string
  title: string
  desc: string
  [key: string]: any
  status?: WorkspaceCardStatus
}

defineProps<{
  items: WorkspaceCardItem[]
}>()

const statusMap = {
  ACTIVE: {
    color: 'primary',
    label: 'Active',
  },
  INACTIVE: {
    color: 'neutral',
    label: 'Inactive',
  },
  PROGRESS: {
    color: 'warning',
    label: 'Setup in Progress',
  },
  SUBMITTED: {
    color: 'success',
    label: 'Request Submitted',
  },
} satisfies Record<WorkspaceCardStatus, WorkspaceCardStatusItem>

function statusValue(status: WorkspaceCardStatus) {
  return statusMap[status]
}
</script>

<template>
  <li
    v-for="(o, idx) in items"
    :key="idx"
    class="p-4 bg-elevated/50 flex flex-col gap-4 border border-default transition-all rounded-lg"
  >
    <div class="flex items-center gap-2">
      <template v-if="o.img">
        <NuxtImg
          class="size-14"
          :src="o.img"
        />
      </template>
      <div class="flex-1 flex items-center justify-between gap-2 flex-wrap">
        <BaseTypography
          as="h1"
          :text="o.title"
          type="heading-1"
        />
        <template v-if="o.status">
          <UBadge
            variant="subtle"
            :label="statusValue(o.status).label"
            :color="statusValue(o.status).color"
          />
        </template>
      </div>
    </div>

    <BaseTypography
      as="p"
      :text="o.desc"
      type="text"
    />

    <footer class="mt-auto">
      <slot
        name="footer"
        :item="o"
        :status-props="statusValue(o.status ?? 'INACTIVE')"
      />
    </footer>
  </li>
</template>
