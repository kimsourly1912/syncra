<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()

const user = ref({
  name: 'John Doe',
  avatar: {
    src: 'https://github.com/benjamincanac.png',
    alt: 'John Doe',
  },
})

const items = computed<DropdownMenuItem[][]>(() => ([
  [
    {
      type: 'label',
      label: user.value.name,
      avatar: user.value.avatar,
    },
  ],
  [
    {
      label: 'Profile',
      icon: 'lucide:user',
      to: '',
    },
    {
      label: 'Settings',
      icon: 'lucide:settings',
      to: '/admin/settings',
    },
  ],
  [
    {
      label: 'Appearance',
      icon: colorMode.preference === 'light' ? 'lucide:sun' : 'lucide:moon',
      children: [
        {
          label: 'Light',
          icon: 'lucide:sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onSelect(e: Event) {
            e.preventDefault()
            colorMode.preference = 'light'
          },
        },
        {
          label: 'Dark',
          icon: 'lucide:moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onUpdateChecked(checked: boolean) {
            if (checked) {
              colorMode.preference = 'dark'
            }
          },
          onSelect(e: Event) {
            e.preventDefault()
          },
        },
      ],
    },
  ],
  [
    {
      label: 'Log out',
      icon: 'lucide:log-out',
    },
  ],
]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <!-- <UButton v-bind="{
      ...user,
      label: collapsed ? undefined : user?.name,
      trailingIcon: collapsed ? undefined : 'lucide:chevrons-up-down'
    }" color="neutral" variant="ghost" block :square="collapsed" class="data-[state=open]:bg-elevated" :ui="{
      trailingIcon: 'text-dimmed'
    }" /> -->
  </UDropdownMenu>
</template>
