<script setup lang="ts">
defineProps<{
  value: string
}>()
</script>

<template>
  <section>
    <h1 class="text-highlighted text-sm font-semibold">
      Create a password that:
    </h1>
    <ul class="text-sm text-muted mt-1">
      <li
        v-for="(o, idx) in getPasswordValidationMessages(value)"
        :key="idx"
        class="flex items-center gap-2"
      >
        <UIcon
          v-if="o.valid"
          name="lucide:check"
        />
        <UIcon
          v-else
          name="lucide:circle-small"
        />
        <span class="flex-1">{{ o.text }}</span>
      </li>
    </ul>
  </section>
</template>
