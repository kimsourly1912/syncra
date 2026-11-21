<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const props = defineProps<{
  items: NavigationMenuItem[]
  signingOut: boolean
}>()

const emit = defineEmits<{
  navigate: []
  signOut: []
}>()

const router = useRouter()

// Links to pages that don't exist yet are hidden, and so is a heading left with no links.
// Checked against the route table: `router.resolve` warns for every unknown path.
const routePaths = new Set(router.getRoutes().map(route => route.path))
const visible = computed(() => {
  const exists = (item: NavigationMenuItem) => item.type !== 'link' || routePaths.has(item.to as string)
  const items = props.items.filter(exists)
  return items.filter((item, index) => item.type !== 'label' || items[index + 1]?.type === 'link')
})
</script>

<template>
  <div class="flex flex-1 flex-col">
    <ul>
      <template
        v-for="(item, index) in visible"
        :key="index"
      >
        <li
          v-if="item.type === 'label'"
          class="py-2 px-4"
        >
          <span class="text-highlighted text-sm">{{ item.label }}</span>
        </li>
        <li
          v-else
          @click="emit('navigate')"
        >
          <ULink
            :to="item.to"
            class="border-l-6 inline-flex py-2 px-4 w-full"
            active-class="border-primary bg-white text-highlighted"
            inactive-class="border-transparent text-secondary"
          >
            {{ item.label }}
          </ULink>
        </li>
      </template>
    </ul>
    <footer class="p-2.5 flex-1 flex items-end">
      <UButton
        label="Log Out"
        variant="outline"
        block
        color="neutral"
        :loading="signingOut"
        @click="emit('signOut')"
      />
    </footer>
  </div>
</template>
