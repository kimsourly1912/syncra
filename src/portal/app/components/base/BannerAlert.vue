<script setup lang="ts">
import type { NuxtUIColor } from '~/types/nuxt-ui'

const colorMap = {
  primary: {
    text: tw`text-primary`,
    ring: tw`ring-primary/50`,
  },
  error: {
    text: tw`text-error`,
    ring: tw`ring-error/50`,
  },
  info: {
    text: tw`text-info`,
    ring: tw`ring-info/50`,
  },
  neutral: {
    text: tw`text-neutral`,
    ring: tw`ring-neutral/50`,
  },
  secondary: {
    text: tw`text-secondary`,
    ring: tw`ring-secondary/50`,
  },
  success: {
    text: tw`text-success`,
    ring: tw`ring-success/50`,
  },
  warning: {
    text: tw`text-warning`,
    ring: tw`ring-warning/50`,
  },
} satisfies Record<NuxtUIColor, { text: string, ring: string }>

const props = defineProps<{
  icon: string
  title: string
  desc: string
  btnLabel: string
  color: NuxtUIColor
}>()

defineEmits<{
  click: []
}>()

const theme = computed(() => colorMap[props.color])
</script>

<template>
  <section :class="['flex items-start gap-4 ring ring-inset rounded-lg p-3', theme.ring]">
    <section>
      <UIcon
        :name="icon"
        :class="['size-6', theme.text]"
      />
    </section>

    <section class="space-y-3">
      <header>
        <h1 :class="['font-semibold', theme.text]">
          {{ title }}
        </h1>
        <p class="text-muted text-sm">
          {{ desc }}
        </p>
      </header>
      <UButton
        :label="btnLabel"
        class="underline"
        variant="ghost"
        :color
        @click="$emit('click')"
      />
    </section>
  </section>
</template>
