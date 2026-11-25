<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { PasswordSuggestion, resetPasswordSchema, useResetPassword } from '@/features/auth'
import type { IResetPasswordSchema } from '@/features/auth'

definePageMeta({ access: 'guest', layout: 'auth' })

const route = useRoute()
const { pending, success, submit } = useResetPassword()
const token = typeof route.query.token === 'string' ? route.query.token : undefined

const data = reactive<IResetPasswordSchema>({
  newPassword: '',
  confirmPassword: '',
})

const FIELD_NAME = {
  newPassword: 'newPassword',
  confirmPassword: 'confirmPassword',
} satisfies { [K in keyof IResetPasswordSchema]: K }

async function onSubmit(evt: FormSubmitEvent<IResetPasswordSchema>) {
  const changed = await submit(token, evt.data)
  // The token is used up: drop it from the address bar and history. `history.replaceState`, not
  // the router, so the guest guard doesn't run and leave the "Password Changed" screen.
  if (changed) window.history.replaceState(window.history.state, '', route.path)
  return changed
}
</script>

<template>
  <div class="p-4 max-w-lg w-full space-y-4">
    <template v-if="success">
      <section class="bg-default flex flex-col items-center gap-6 rounded-lg p-6 text-center">
        <UBadge
          icon="lucide:circle-check"
          size="xl"
          square
          class="rounded-full p-3"
        />
        <p class="text-muted">
          Password Changed
        </p>
        <UButton
          label="Continue to Syncra Admin"
          block
          to="/"
        />
      </section>
    </template>

    <template v-else>
      <section class="bg-default rounded-lg p-6 space-y-8">
        <header class="flex flex-col gap-4 items-center text-center">
          <img
            src="/img/syncra-logo.png"
            class="w-14"
          >
          <h1 class="font-medium text-highlighted text-2xl">
            Change Your Password
          </h1>
        </header>

        <UForm
          class="space-y-4"
          :state="data"
          :schema="resetPasswordSchema"
          :validate-on="[]"
          @submit="onSubmit"
        >
          <UFormField
            label="New Password"
            :name="FIELD_NAME.newPassword"
            required
          >
            <InputPassword v-model="data.newPassword" />
          </UFormField>

          <PasswordSuggestion :value="data.newPassword" />

          <UFormField
            label="Confirm Password"
            :name="FIELD_NAME.confirmPassword"
            required
          >
            <InputPassword v-model="data.confirmPassword" />
          </UFormField>

          <UButton
            type="submit"
            label="Change Password"
            block
            :loading="pending"
          />
        </UForm>
      </section>
    </template>
  </div>
</template>
