<script setup lang="ts">
import { tv } from 'tailwind-variants'
import type { ComponentConfig } from '@nuxt/ui'
import type { AppConfig } from '@nuxt/schema'

type BaseBadge = ComponentConfig<typeof $tv, AppConfig, 'baseBadge'>

interface BaseBadgeProps {
  icon: string
  size?: BaseBadge['variants']['size']
  color?: BaseBadge['variants']['color']
}

const $tv = tv({
  slots: {
    icon: tw`text-white`,
    root: tw`flex items-center justify-center rounded-full`,
  },
  variants: {
    size: {
      xs: {
        root: tw`size-8`,
        icon: tw`size-4 min-w-4`,
      },
      sm: {
        root: tw`size-10`,
        icon: tw`size-5 min-w-5`,
      },
      md: {
        root: tw`size-12`,
        icon: tw`size-6 min-w-6`,
      },
      lg: {
        root: tw`size-14`,
        icon: tw`size-6 min-w-6`,
      },
      xl: {
        root: tw`size-16`,
        icon: tw`size-6 min-w-6`,
      },
    },
    color: {
      primary: {
        root: tw`bg-primary`,
      },
      error: {
        root: tw`bg-error`,
      },
      info: {
        root: tw`bg-info`,
      },
      neutral: {
        root: tw`bg-neutral-500`,
      },
      secondary: {
        root: tw`bg-secondary`,
      },
      success: {
        root: tw`bg-success`,
      },
      warning: {
        root: tw`bg-warning`,
      },
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'primary',
  },
})

const props = defineProps<BaseBadgeProps>()
const ui = computed(() => $tv(props))
</script>

<template>
  <div :class="ui.root()">
    <UIcon
      :name="icon"
      :class="ui.icon()"
    />
  </div>
</template>
