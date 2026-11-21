<script setup lang="ts">
defineProps<{
  name: string
  length: number
  loading: boolean
  loadingResend: boolean
}>()

defineEmits<{
  resend: []
}>()

const model = defineModel<string[]>({
  default: [],
})
</script>

<template>
  <section class="flex flex-col gap-4">
    <section class="space-y-4">
      <UFormField
        label="Verification Code"
        :name
        required
      >
        <UPinInput
          v-model="model"
          otp
          :length
          size="lg"
        />
      </UFormField>

      <section class="flex items-center gap-2">
        <span class="text-muted text-sm">Didn't receive the code?</span>
        <UButton
          variant="link"
          to="#"
          label="Resend"
          class="underline"
          color="info"
          :disabled="loadingResend || loading"
          :loading="loadingResend"
          @click="$emit('resend')"
        />
      </section>
    </section>

    <UButton
      type="submit"
      block
      color="neutral"
      :loading
    >
      Verify
    </UButton>
  </section>
</template>
