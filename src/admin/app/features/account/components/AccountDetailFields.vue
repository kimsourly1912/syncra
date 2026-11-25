<script setup lang="ts">
defineProps<{
  /** A missing value shows as a dash. */
  fields: { label: string, value: string | null | undefined }[]
  /** Placeholders in the values' place while they load. */
  loading?: boolean
}>()
</script>

<template>
  <!-- Label beside value when there's room (22rem); in a narrow column the label sits above. -->
  <dl class="@container divide-y divide-default">
    <div
      v-for="field in fields"
      :key="field.label"
      class="grid gap-0.5 py-3 text-sm @min-[22rem]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @min-[22rem]:items-baseline @min-[22rem]:gap-3"
    >
      <dt class="text-muted">
        {{ field.label }}
      </dt>
      <dd class="font-medium wrap-anywhere text-highlighted">
        <USkeleton
          v-if="loading"
          class="h-4 w-3/4"
        />
        <template v-else>
          {{ field.value || NO_VALUE }}
        </template>
      </dd>
    </div>
  </dl>
</template>
