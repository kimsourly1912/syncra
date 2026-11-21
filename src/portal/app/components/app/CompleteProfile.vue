<script setup lang="ts">
export type CompleteProfileState = 'complete-profile' | 'form' | 'success'

defineProps<{
  step: UseOnboardingStepperType
}>()

const emits = defineEmits<{
  close: []
  contact: []
}>()

const state = defineModel<CompleteProfileState>('state', { default: 'complete-profile' })

function close() {
  emits('close')
}
</script>

<template>
  <template v-if="state === 'complete-profile'">
    <main class="flex flex-col gap-10">
      <ModalHeading
        title="Finish Profile Setup"
        description="You haven’t completed your setup yet. Add your company and representative info to continue."
        icon="lucide:edit"
      />

      <footer class="w-full">
        <section class="flex gap-4">
          <UButton
            label="Close"
            variant="outline"
            block
            @click="close"
          />
          <UButton
            label="Complete My Profile"
            block
            @click="state = 'form'"
          />
        </section>
        <p class="text-muted text-sm mt-10 text-center">
          You can update your company information anytime from Settings.
        </p>
      </footer>
    </main>
  </template>

  <template v-if="state === 'form'">
    <template v-if="step === 'representative-details'">
      <main class="space-y-8">
        <section>
          <span class="text-muted font-semibold">Step 1 of 2</span>
          <h1 class="text-2xl text-highlighted font-semibold mt-4 mb-2">
            Representative Details
          </h1>
          <p class="text-muted">
            Tell us about yourself and how we can reach you
          </p>
        </section>
        <slot name="representative" />
      </main>
    </template>

    <template v-if="step === 'company-details'">
      <main class="space-y-8">
        <section>
          <span class="text-muted font-semibold">Step 2 of 2</span>
          <h1 class="text-2xl text-highlighted font-semibold mt-4 mb-2">
            Company Details
          </h1>
          <p class="text-muted">
            Tell us about company
          </p>
        </section>
        <slot name="company" />
      </main>
    </template>
  </template>

  <template v-if="state === 'success'">
    <main class="flex flex-col gap-10">
      <ModalHeading
        title="Profile Setup Complete"
        description="Great work! Your company and representative information are all set. Now let's activate Syncra's AI applications for your workspace."
        icon="lucide:circle-check-big"
      />

      <USeparator />

      <p class="text-muted text-center">
        Next Step: Unlock Syncra's Applications
      </p>

      <footer class="w-full">
        <section class="flex gap-4">
          <UButton
            label="Close"
            variant="outline"
            block
            @click="close"
          />
          <UButton
            label="Contact Sales"
            block
            @click="$emit('contact')"
          />
        </section>
        <p class="text-muted text-sm mt-10 text-center">
          You can update your company information anytime from Settings.
        </p>
      </footer>
    </main>
  </template>
</template>
