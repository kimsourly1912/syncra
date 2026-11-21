<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { SchemaToString } from '@/types/common'
import { forgotEmailSchema } from '@/schema/auth.schema'
import type { IForgotEmailSchema } from '@/schema/auth.schema'
import { useForgotPassword } from '@/features/auth'

definePageMeta({ access: 'guest', layout: 'auth' })

const { pending, sent: success, submit } = useForgotPassword()
const data = reactive<IForgotEmailSchema>({
  email: '',
})

const FIELD_NAME = {
  email: 'email',
} satisfies SchemaToString<IForgotEmailSchema>

function onSubmit(evt: FormSubmitEvent<IForgotEmailSchema>) {
  return submit(evt.data)
}
</script>

<template>
  <div class="p-4 max-w-lg w-full space-y-4">
    <template v-if="success">
      <section class="bg-white flex flex-col items-center gap-6 rounded-lg p-6 text-center">
        <BaseIconBadge
          icon="lucide:circle-check"
          size="lg"
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
      <section class="bg-white rounded-lg p-6 space-y-6">
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
          :schema="forgotEmailSchema"
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
