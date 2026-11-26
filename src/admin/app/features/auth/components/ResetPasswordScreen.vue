<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { resetPasswordSchema } from '../schemas/reset-password-form'
import type { IResetPasswordSchema } from '../schemas/reset-password-form'
import { AUTH_PATHS, useAuthLinks } from '../composables/useAuthLinks'
import { useResetPassword } from '../composables/useResetPassword'
import AuthCard from './AuthCard.vue'
import PasswordSuggestion from './PasswordSuggestion.vue'

const { state, email, linkError, checking, retry, pending, error, signedIn, submit } = useResetPassword()
const links = useAuthLinks()

const data = reactive<IResetPasswordSchema>({
  newPassword: '',
  confirmPassword: '',
})

const FIELD_NAME = {
  newPassword: 'newPassword',
  confirmPassword: 'confirmPassword',
} satisfies { [K in keyof IResetPasswordSchema]: K }

function onSubmit(evt: FormSubmitEvent<IResetPasswordSchema>) {
  return submit(evt.data)
}
</script>

<template>
  <AuthCard
    v-if="state === 'checking'"
    title="Checking your link"
  >
    <div class="flex justify-center">
      <UIcon
        name="lucide:loader-circle"
        class="size-6 animate-spin text-muted"
        aria-label="Checking"
      />
    </div>
  </AuthCard>

  <AuthCard
    v-else-if="state === 'unavailable'"
    title="Couldn't check your link"
    :back="links.signIn.value"
  >
    <AlertApiError
      :error="linkError"
      title="Could not check the reset link"
      :retrying="checking"
      @retry="retry"
    />
  </AuthCard>

  <AuthCard
    v-else-if="state === 'invalid'"
    icon="lucide:link-2-off"
    icon-color="error"
    title="This link can't be used"
    description="Reset links expire, and each one works only once. Request a new link to set your password."
    :back="links.signIn.value"
  >
    <UButton
      label="Request a new link"
      block
      :to="AUTH_PATHS.forgot"
    />
  </AuthCard>

  <AuthCard
    v-else-if="state === 'done'"
    icon="lucide:circle-check"
    icon-color="success"
    title="Password changed"
    :description="signedIn ? 'You\'re signed in with your new password.' : 'Sign in with your new password.'"
  >
    <UButton
      v-if="signedIn"
      label="Continue to Syncra Admin"
      block
      to="/"
    />
    <UButton
      v-else
      label="Sign in"
      block
      :to="AUTH_PATHS.signIn"
    />
  </AuthCard>

  <AuthCard
    v-else
    title="Set a new password"
    :back="links.signIn.value"
    :error
  >
    <template #description>
      <template v-if="email">
        For <span class="font-medium text-highlighted wrap-anywhere">{{ email }}</span>
      </template>
      <template v-else>
        Choose a new password for your staff account.
      </template>
    </template>

    <UForm
      class="space-y-4"
      :state="data"
      :schema="resetPasswordSchema"
      :validate-on="[]"
      @submit="onSubmit"
    >
      <!-- Tells password managers which account the new password belongs to. -->
      <input
        v-if="email"
        type="email"
        name="username"
        autocomplete="username"
        :value="email"
        class="hidden"
        readonly
      >

      <UFormField
        label="New password"
        :name="FIELD_NAME.newPassword"
        required
      >
        <InputPassword
          v-model="data.newPassword"
          autocomplete="new-password"
          autofocus
        />
      </UFormField>

      <PasswordSuggestion :value="data.newPassword" />

      <UFormField
        label="Confirm new password"
        :name="FIELD_NAME.confirmPassword"
        required
      >
        <InputPassword
          v-model="data.confirmPassword"
          autocomplete="new-password"
        />
      </UFormField>

      <UButton
        type="submit"
        label="Change password"
        block
        :loading="pending"
      />
    </UForm>
  </AuthCard>
</template>
