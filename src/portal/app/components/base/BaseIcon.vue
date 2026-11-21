<script lang="ts">
import { tv } from 'tailwind-variants'
import type { NuxtUIColor } from '~/types/nuxt-ui'

export type BaseIconColor = NuxtUIColor
export type BaseIconSize = 'sm' | 'md' | 'lg'
export type BaseIconVariant = 'soft' | 'solid' | 'subtle'
</script>

<script setup lang="ts">
const $tv = tv({
  variants: {
    color: {
      info: '',
      error: '',
      primary: '',
      success: '',
      warning: '',
      secondary: '',
      neutral: '',
    } satisfies Record<BaseIconColor, string>,
    size: {
      sm: {
        icon: tw`size-5`,
        base: tw`size-10`,
      },
      md: {
        icon: tw`size-6`,
        base: tw`size-12`,
      },
      lg: {
        icon: tw`size-7`,
        base: tw`size-14`,
      },
    },
    variant: {
      soft: tw``,
      solid: tw`text-inverted`,
      subtle: tw`ring-4 text-inverted`,
    } satisfies Record<BaseIconVariant, string>,
  },
  slots: {
    icon: tw`shrink-0`,
    base: tw`inline-flex shrink-0 items-center justify-center rounded-full`,
  },
  compoundVariants: [
    {
      color: 'primary',
      variant: 'soft',
      class: tw`bg-primary/25 text-primary`,
    },
    {
      color: 'error',
      variant: 'soft',
      class: tw`bg-error/25 text-error`,
    },
    {
      color: 'info',
      variant: 'soft',
      class: tw`bg-info/25 text-info`,
    },
    {
      color: 'neutral',
      variant: 'soft',
      class: tw`bg-neutral-500/25 text-neutral-500`,
    },
    {
      color: 'secondary',
      variant: 'soft',
      class: tw`bg-secondary/25 text-secondary`,
    },
    {
      color: 'success',
      variant: 'soft',
      class: tw`bg-success/25 text-success`,
    },
    {
      color: 'warning',
      variant: 'soft',
      class: tw`bg-warning/25 text-warning`,
    },
    // Solid
    {
      color: 'primary',
      variant: 'solid',
      class: tw`bg-primary`,
    },
    {
      color: 'error',
      variant: 'solid',
      class: tw`bg-error`,
    },
    {
      color: 'info',
      variant: 'solid',
      class: tw`bg-info`,
    },
    {
      color: 'neutral',
      variant: 'solid',
      class: tw`bg-neutral-900`,
    },
    {
      color: 'secondary',
      variant: 'solid',
      class: tw`bg-secondary`,
    },
    {
      color: 'success',
      variant: 'solid',
      class: tw`bg-success`,
    },
    {
      color: 'warning',
      variant: 'solid',
      class: tw`bg-warning`,
    },
    // Subtle
    {
      color: 'primary',
      variant: 'subtle',
      class: tw`bg-primary ring-primary/25`,
    },
    {
      color: 'error',
      variant: 'subtle',
      class: tw`bg-error ring-error/25`,
    },
    {
      color: 'info',
      variant: 'subtle',
      class: tw`bg-info ring-info/25`,
    },
    {
      color: 'neutral',
      variant: 'subtle',
      class: tw`bg-neutral-900 ring-neutral-500/25`,
    },
    {
      color: 'secondary',
      variant: 'subtle',
      class: tw`bg-secondary ring-secondary/25`,
    },
    {
      color: 'success',
      variant: 'subtle',
      class: tw`bg-success ring-success/25`,
    },
    {
      color: 'warning',
      variant: 'subtle',
      class: tw`bg-warning ring-warning/25`,
    },
  ],
})

const props = withDefaults(defineProps<{
  name: string
  size?: BaseIconSize
  color?: BaseIconColor
  variant?: BaseIconVariant
}>(), {
  size: 'md',
  color: 'primary',
  variant: 'soft',
})

const slots = computed(() => $tv({ ...props }))
</script>

<template>
  <div :class="slots.base()">
    <UIcon
      :name
      :class="slots.icon()"
    />
  </div>
</template>
