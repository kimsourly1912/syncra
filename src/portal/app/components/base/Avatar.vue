<script setup lang="ts">
import { UAvatar } from '#components'
import type { AvatarProps } from '@nuxt/ui'

const props = defineProps<AvatarProps>()

const text = computed(() => props.text || getInitials(props.alt || ''))
const ui = computed(() => ({ ...props.ui, fallback: tw`text-xs ${props.ui?.fallback ?? ''}` }))
</script>

<template>
  <UAvatar
    v-bind="props"
    :text="text"
    :ui="ui"
  />
</template>
