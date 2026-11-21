<script setup lang="ts">
// type FileUploadFiles<M> = (M extends true ? File[] : File)

withDefaults(defineProps<{
  show?: {
    success?: boolean
    delete?: boolean
  }
  files: File[]
}>(), {
  show() {
    return {
      success: true,
      delete: true,
    }
  },
})

defineEmits<{
  delete: [file: File, idx: number]
}>()
</script>

<template>
  <li
    v-for="(o, idx) in files"
    :key="o.lastModified"
    class="p-4 bg-elevated/50 flex items-center justify-between gap-4 border border-default transition-all rounded-lg"
  >
    <section class="flex items-start gap-4 flex-1">
      <UBadge
        icon="lucide:file"
        color="info"
        variant="soft"
        size="xl"
      />

      <section class="space-y-1">
        <h1 class="text-highlighted">
          {{ o.name }}
        </h1>

        <div class="flex items-center gap-4 flex-wrap">
          <span class="text-muted text-sm font-semibold">{{ humanFileSize(o.size) }}</span>
          <div
            v-if="show.success"
            class="flex items-center gap-1"
          >
            <UIcon
              class="text-success"
              name="lucide:circle-check"
            />
            <span class="text-sm text-muted flex-1">Uploaded Successfully</span>
          </div>
        </div>
      </section>
    </section>

    <template v-if="show.delete">
      <UButton
        icon="lucide:trash-2"
        color="error"
        variant="ghost"
        @click="$emit('delete', o, idx)"
      />
    </template>
  </li>
</template>
