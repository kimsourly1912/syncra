<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { signInSchema } from '../schemas/sign-in-form'
import type { ISignInSchema } from '../schemas/sign-in-form'
import { useAuthLinks } from '../composables/useAuthLinks'
import { useSignIn } from '../composables/useSignIn'
import AuthCard from './AuthCard.vue'

const { pending, error, submit } = useSignIn()
const links = useAuthLinks()

const data = reactive<ISignInSchema>({
  email: links.email.value,
  password: '',
})
// Forgot password starts with the address typed here.
watch(() => data.email, (email) => {
  links.email.value = email
})

const FIELD_NAME = {
  email: 'email',
  password: 'password',
} satisfies { [K in keyof ISignInSchema]: K }

function onSubmit(evt: FormSubmitEvent<ISignInSchema>) {
  return submit(evt.data)
}
</script>

<template>
  <AuthCard
    title="Sign in to Syncra Admin"
    description="Use your Syncra staff email and password."
    :error
  >
    <UForm
      class="space-y-4"
      :state="data"
      :schema="signInSchema"
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

      <!-- The link sits beside the label but comes after the input in the DOM, so Tab goes from
           Email straight to Password. -->
      <div class="relative">
        <UFormField
          label="Password"
          :name="FIELD_NAME.password"
          required
        >
          <InputPassword
            v-model="data.password"
            autocomplete="current-password"
          />
        </UFormField>
        <ULink
          :to="links.forgot.value"
          class="absolute top-0 right-0 text-sm text-primary hover:underline"
        >
          Forgot password?
        </ULink>
      </div>

      <UButton
        type="submit"
        label="Sign in"
        block
        :loading="pending"
      />
    </UForm>
  </AuthCard>
</template>
