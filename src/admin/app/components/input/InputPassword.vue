<script setup lang="ts">
defineProps<{
  placeholder?: string
}>()

const show = shallowRef(false)
const model = defineModel<string>()
</script>

<template>
  <UInput
    v-model="model"
    class="w-full"
    :type="show ? 'text' : 'password'"
    :placeholder
  >
    <template #trailing>
      <UButton
        color="neutral"
        variant="link"
        :icon="show ? 'lucide:eye-off' : 'lucide:eye'"
        :aria-label="show ? 'Hide password' : 'Show password'"
        :aria-pressed="show"
        @click="show = !show"
      />
    </template>
  </UInput>
</template>
