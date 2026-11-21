<script lang="ts" setup>
defineProps<{
  to?: string
  title?: string
}>()
</script>

<template>
  <UDashboardNavbar
    toggle-side="right"
    :ui="{ right: 'gap-3' }"
  >
    <template
      #leading
    >
      <template v-if="to">
        <UButton
          :to
          icon="lucide:arrow-left"
          variant="ghost"
          color="neutral"
          :label="title"
          size="lg"
        />
      </template>
      <template v-else>
        <BaseTypography
          :text="title"
        />
      </template>
    </template>

    <template #right>
      <TokenBalanceBadge />
    </template>
  </UDashboardNavbar>
</template>
