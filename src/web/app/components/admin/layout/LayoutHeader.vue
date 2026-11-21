<script lang="ts" setup>
import { motion } from 'motion-v'

defineProps<{
  title: string
}>()
</script>

<template>
  <UDashboardNavbar
    :title
    :ui="{ right: 'gap-3' }"
  >
    <template #leading>
      <UDashboardSidebarCollapse />
    </template>

    <template #right>
      <section>
        Token(s)
        <UBadge
          label="66"
          variant="subtle"
          size="md"
        />
      </section>

      <UTooltip
        text="Notifications"
        :shortcuts="['N']"
      >
        <UButton
          color="neutral"
          variant="ghost"
          square
        >
          <UChip
            color="error"
            inset
          >
            <UIcon
              name="lucide:bell"
              class="size-5 shrink-0"
            />
          </UChip>
        </UButton>
      </UTooltip>

      <UColorModeButton />
    </template>
  </UDashboardNavbar>
</template>
