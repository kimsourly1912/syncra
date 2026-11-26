<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { forgotPasswordSchema } from '../schemas/forgot-password-form'
import type { IForgotPasswordSchema } from '../schemas/forgot-password-form'
import { useAuthLinks } from '../composables/useAuthLinks'
import { useForgotPassword } from '../composables/useForgotPassword'
import AuthCard from './AuthCard.vue'

const { pending, sentTo, error, cooldown, submit, resend, startOver } = useForgotPassword()
const links = useAuthLinks()

const data = reactive<IForgotPasswordSchema>({
  email: links.email.value,
})
// Back on sign-in, the address is still filled in.
watch(() => data.email, (email) => {
  links.email.value = email
})

const FIELD_NAME = {
  email: 'email',
} satisfies { [K in keyof IForgotPasswordSchema]: K }

function onSubmit(evt: FormSubmitEvent<IForgotPasswordSchema>) {
  return submit(evt.data)
}
</script>

<template>
  <AuthCard
    v-if="sentTo"
    icon="lucide:mail-check"
    icon-color="success"
    title="Check your email"
    :error
  >
    <template #description>
      We sent a link to reset your password to
      <span class="font-medium text-highlighted wrap-anywhere">{{ sentTo }}</span>.
    </template>

    <div class="space-y-3">
      <UButton
        label="Back to sign in"
        block
        :to="links.signIn.value"
      />
      <UButton
        :label="cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend link'"
        color="neutral"
        variant="outline"
        block
        :loading="pending"
        :disabled="cooldown > 0"
        @click="resend"
      />
    </div>

    <template #footer>
      Can't find it? Check your spam folder, or
      <UButton
        label="use a different email"
        variant="link"
        class="p-0 align-baseline"
        @click="startOver"
      />.
    </template>
  </AuthCard>

  <AuthCard
    v-else
    title="Reset your password"
    description="Enter your staff email and we'll send you a link to set a new password."
    :back="links.signIn.value"
    :error
  >
    <UForm
      class="space-y-4"
      :state="data"
      :schema="forgotPasswordSchema"
      :validate-on="[]"
      @submit="onSubmit"
    >
      <UFormField
        label="Email"
        :name="FIELD_NAME.email"
        required
      >
        <UInput
          v-model="data.email"
          type="email"
          autocomplete="username"
          autofocus
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        label="Send reset link"
        block
        :loading="pending"
      />
    </UForm>
  </AuthCard>
</template>
