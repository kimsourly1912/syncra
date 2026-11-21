<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'

/**
 * The search box of a list toolbar. Applies `delay` ms after typing stops, or at once on Enter or
 * Clear. The model receives the trimmed text. `/` focuses it (its hint shows while empty).
 *
 * @example
 * <InputSearch :model-value="list.search.value" placeholder="Search leads…" @update:model-value="list.setSearch" />
 */
const model = defineModel<string>({ default: '' })
const props = withDefaults(defineProps<{
  placeholder?: string
  delay?: number
}>(), {
  placeholder: 'Search…',
  delay: 300,
})

const text = ref(model.value)
const input = useTemplateRef('input')

defineShortcuts({ '/': () => input.value?.inputRef?.focus() })

function apply() {
  const value = text.value.trim()
  if (value !== model.value) model.value = value
}

watchDebounced(text, apply, { debounce: props.delay })

// Changed from outside (Clear filters, Back): show it, unless it's only the trimmed input.
watch(model, (value) => {
  if (value !== text.value.trim()) text.value = value
})

function clear() {
  text.value = ''
  apply()
}
</script>

<template>
  <UInput
    ref="input"
    v-model="text"
    type="search"
    icon="lucide:search"
    :placeholder="placeholder"
    :aria-label="placeholder"
    :ui="{ trailing: 'pe-1' }"
    @keydown.enter="apply"
  >
    <template #trailing>
      <UKbd
        v-if="!text"
        value="/"
      />
      <UButton
        v-else
        color="neutral"
        variant="link"
        size="sm"
        icon="lucide:x"
        aria-label="Clear search"
        @click="clear"
      />
    </template>
  </UInput>
</template>
