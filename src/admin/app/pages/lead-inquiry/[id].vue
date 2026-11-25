<script setup lang="ts">
// A lead opens in a side panel on the list. Old links to `/lead-inquiry/7` open it there.
const route = useRoute()
const id = Number(route.params.id)
await navigateTo({ path: '/lead-inquiry', query: Number.isInteger(id) && id > 0 ? { lead: String(id) } : {} }, { replace: true })
</script>

<template>
  <div />
</template>
