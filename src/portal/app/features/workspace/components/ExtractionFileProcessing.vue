<script setup lang="ts">
import type { DocAIDTO } from '@/types/dto'
import type { AcceptLiteral } from '~/types/common'

const props = defineProps<{
  formattedId?: string | null
  progress?: number | null
  errorMessage?: string | null
  estimatedSeconds?: number | null
  status?: AcceptLiteral<DocAIDTO.DocAIJobStatus>
}>()

const statusLabel = computed(() => {
  switch (props.status) {
    case 'PROCESSING':
      return 'Processing'
    case 'PENDING':
      return 'Queued'
    case 'COMPLETED':
      return 'Completed'
    case 'PARTIAL_COMPLETED':
      return 'Partial Completed'
    case 'FAILED':
      return 'Failed'
    default:
      return 'Pending'
  }
})

const isFailed = computed(() => props.status === 'FAILED')

const durationLabel = computed(() => {
  if (!props.estimatedSeconds && props.estimatedSeconds !== 0)
    return 'This may take a few moments'

  const minutes = Math.floor(props.estimatedSeconds / 60)
  const seconds = props.estimatedSeconds % 60
  const minText = minutes > 0 ? `${minutes} min` : ''
  const secText = `${seconds} sec`

  return `This may take ${[minText, secText].filter(Boolean).join(' ')}`
})

</script>

<template>
  <LayoutWrapper>
    <section class="flex items-start gap-4">
      <UBadge
        icon="lucide:loader"
        size="xl"
        class="rounded-full"
        :ui="{
          base: tw`size-10 justify-center`,
          leadingIcon: tw`size-5`,
        }"
      />
      <div class="flex-1">
        <h1 class="font-semibold text-highlighted">
          Doc AI Processing
        </h1>
        <p class="text-muted text-sm">
          <template v-if="isFailed">
            Unable to complete this job.
            <span class="text-error font-semibold">{{ props.errorMessage || 'See logs for details.' }}</span>
          </template>
          <template v-else>
            Doc AI is extracting and structuring your document data.
            <span class="text-primary font-semibold">{{ durationLabel }}</span>
          </template>
        </p>
        <p
          v-if="props.formattedId"
          class="text-xs text-muted"
        >
          {{ formattedId }} | Status: <span class="font-semibold capitalize">{{ statusLabel }}</span>
        </p>
      </div>
    </section>

    <section class="flex items-center justify-center flex-col gap-10 mt-20">
      <section class="size-24 bg-primary/10 rounded-full flex items-center justify-center">
        <UIcon
          :name="isFailed ? 'lucide:circle-x' : 'app:loading'"
          :class="['size-10', isFailed ? 'text-error' : 'text-primary']"
        />
      </section>
    </section>
  </LayoutWrapper>
</template>
