<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
}>(), {
  title: 'Loading...',
})
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <ModalContent
    v-model:open="model"
    :dismissible="false"
    :ui="{
      content: tw`bg-transparent shadow-none ring-0`,
    }"
  >
    <slot :model>
      <section class="p-4 flex items-center gap-4 flex-col">
        <UIcon
          name="app:loading"
          class="size-10"
        />
        <span>{{ title }}</span>
      </section>
    </slot>
  </ModalContent>
</template>
