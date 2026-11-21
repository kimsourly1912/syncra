<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const profileStore = useProfileStore()

defineProps<{
  src?: string
}>()

const items = computed<DropdownMenuItem[][]>(() => ([
  [
    {
      label: 'Profile',
      icon: 'lucide:user',
      to: toRoute('/settings/account-profile'),
    },
    {
      label: 'Settings',
      icon: 'lucide:settings',
      to: toRoute('/settings'),
    },
  ],
  [
    {
      label: 'Log out',
      icon: 'lucide:log-out',
      async onSelect() {
        await profileStore.onLogout()
      },
    },
  ],
]))
</script>

<template>
  <UDropdownMenu :items>
    <UAvatar
      icon="lucide:user"
      :src="profileStore.data?.logoUrl"
      :as="{ img: 'img' }"
    />
  </UDropdownMenu>
</template>
