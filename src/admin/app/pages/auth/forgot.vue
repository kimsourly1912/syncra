<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { forgotPasswordSchema, useForgotPassword } from '@/features/auth'
import type { IForgotPasswordSchema } from '@/features/auth'

definePageMeta({ access: 'guest', layout: 'auth' })

const { pending, sent: success, submit } = useForgotPassword()
const data = reactive<IForgotPasswordSchema>({
  email: '',
})

const FIELD_NAME = {
  email: 'email',
} satisfies { [K in keyof IForgotPasswordSchema]: K }

function onSubmit(evt: FormSubmitEvent<IForgotPasswordSchema>) {
  return submit(evt.data)
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
          We have sent a reset link to your provided email!
        </p>
        <UButton
          label="Return to login"
          block
          to="/auth/sign-in"
        />
      </section>
    </template>

    <template v-else>
      <section class="bg-default rounded-lg p-6 space-y-6">
        <header class="flex flex-col gap-2 items-center text-center">
          <h1 class="font-medium text-highlighted text-2xl">
            Forgot your Password?
          </h1>
          <p class="text-muted">
            Enter your Email address below and we will send a message to reset your password
          </p>
        </header>

        <UForm
          class="space-y-4"
          :state="data"
          :schema="forgotPasswordSchema"
          @submit="onSubmit"
        >
          <UFormField
            label="Email Address"
            required
            :name="FIELD_NAME.email"
          >
            <UInput
              v-model="data.email"
              class="w-full"
            />
          </UFormField>

          <UButton
            type="submit"
            label="Reset My Password"
            block
            :loading="pending"
          />
        </UForm>
      </section>
    </template>
  </div>
</template>
