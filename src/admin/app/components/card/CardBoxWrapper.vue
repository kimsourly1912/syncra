<script setup lang="ts">
const props = defineProps<{
  cols: number
}>()

const columns = computed(() => {
  const c = {
    1: '',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  }
  return c[props.cols as keyof typeof c]
})
</script>

<template>
  <ul :class="['grid grid-cols-1 gap-4', columns]">
    <slot />
  </ul>
</template>
