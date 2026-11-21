<script setup lang="ts">
export interface AuthSocialMediaItem {
  label: string
  icon: string
  loading: boolean
  onClick: (event: MouseEvent) => void
}

defineProps<{
  items: AuthSocialMediaItem[]
}>()
</script>

<template>
  <ul class="space-y-3">
    <li
      v-for="(o, idx) in items"
      :key="idx"
    >
      <UButton
        :label="o.label"
        :icon="o.icon"
        variant="subtle"
        block
        color="neutral"
        :loading="o.loading"
        size="lg"
        :ui="{ base: tw`py-3 rounded-full` }"
        @click="o.onClick"
      />
    </li>
  </ul>
</template>
