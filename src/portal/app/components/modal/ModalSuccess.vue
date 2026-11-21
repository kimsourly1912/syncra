<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <ModalContent v-model="model">
    <template #default="{ close }">
      <main class="flex flex-col gap-5">
        <ModalHeading
          :title
          :description="description"
          icon="lucide:mail-check"
        />

        <UButton
          label="Return"
          variant="outline"
          size="lg"
          block
          color="neutral"
          @click="close"
        />
      </main>
    </template>
  </ModalContent>
</template>
