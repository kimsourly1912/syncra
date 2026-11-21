<script setup lang="ts">
const mode = defineModel<'company' | 'brand'>('mode', { required: true })
const brand = defineModel<string>('brand', { required: true })

defineProps<{
  disabled?: boolean
  compact?: boolean
}>()

const { t } = useI18n()

function selectMode(value: 'company' | 'brand') {
  mode.value = value
}
</script>

<template>
  <section
    class="rounded-2xl border border-default bg-default/80 p-1 shadow-sm backdrop-blur"
    :class="compact ? 'w-full sm:w-auto' : 'space-y-4 p-4'"
  >
    <div
      v-if="!compact"
      class="flex items-start gap-3 px-1 pt-1"
    >
      <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <UIcon
          name="lucide:layers-3"
          class="size-5"
        />
      </div>
      <div>
        <p class="font-semibold text-highlighted">
          {{ t('glossary.scope.title') }}
        </p>
        <p class="mt-0.5 text-sm text-muted">
          {{ t('glossary.scope.description') }}
        </p>
      </div>
    </div>

    <div
      class="grid gap-1 rounded-xl bg-elevated/80 p-1"
      :class="compact ? 'grid-cols-2' : 'sm:grid-cols-2'"
      role="radiogroup"
      :aria-label="t('glossary.scope.title')"
    >
      <UButton
        :label="t('glossary.scope.company')"
        icon="lucide:building-2"
        :variant="mode === 'company' ? 'solid' : 'ghost'"
        :color="mode === 'company' ? 'primary' : 'neutral'"
        :disabled
        block
        role="radio"
        :aria-checked="mode === 'company'"
        @click="selectMode('company')"
      />
      <UButton
        :label="t('glossary.scope.brand')"
        icon="lucide:tag"
        :variant="mode === 'brand' ? 'solid' : 'ghost'"
        :color="mode === 'brand' ? 'primary' : 'neutral'"
        :disabled
        block
        role="radio"
        :aria-checked="mode === 'brand'"
        @click="selectMode('brand')"
      />
    </div>

    <div
      v-if="mode === 'brand' && !compact"
      class="space-y-2 px-1 pb-1"
    >
      <label
        for="glossary-brand-key"
        class="text-sm font-medium text-highlighted"
      >
        {{ t('glossary.scope.brandKey') }}
      </label>
      <UInput
        id="glossary-brand-key"
        v-model="brand"
        icon="lucide:tag"
        :placeholder="t('glossary.scope.brandPlaceholder')"
        :disabled
        class="w-full"
        autocomplete="off"
      />
      <p class="flex items-start gap-1.5 text-xs text-muted">
        <UIcon
          name="lucide:shield-check"
          class="mt-0.5 size-3.5 shrink-0 text-primary"
        />
        {{ t('glossary.scope.brandHelp') }}
      </p>
    </div>
  </section>
</template>
