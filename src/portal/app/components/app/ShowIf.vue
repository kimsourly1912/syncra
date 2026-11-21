<script setup lang="ts">
import type { PermissionActions, PermissionSubjects } from '@/composables/usePermission'

const profileStore = useProfileStore()
const { can } = usePermission()

const props = defineProps<{
  action: PermissionActions
  subject: PermissionSubjects
}>()

const canAccess = computed(() => can(profileStore.userRole, props.subject, props.action))
</script>

<template>
  <template v-if="canAccess">
    <slot />
  </template>
  <template v-else>
    <slot name="fallback" />
  </template>
</template>
