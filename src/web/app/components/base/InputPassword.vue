<script lang="ts" setup>
import type { InputProps } from '@nuxt/ui'

const props = defineProps<InputProps>()
const data = defineModel<string>({ default: '' })
const show = defineModel<boolean>('show', { default: false })
</script>

<template>
  <UInput
    v-model="data"
    :size="props.size"
    :type="show ? 'text' : 'password'"
    class="w-full"
    :placeholder="props.placeholder"
  >
    <template #trailing>
      <UButton
        :size="props.size"
        :icon="show ? 'lucide:eye-off' : 'lucide:eye'"
        color="neutral"
        variant="link"
        @click="show = !show"
      />
    </template>
  </UInput>
</template>
