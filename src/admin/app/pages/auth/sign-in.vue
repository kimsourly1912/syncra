<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { signInSchema } from '@/schema/auth.schema'
import type { SchemaToString } from '@/types/common'
import type { ISignInSchema } from '@/schema/auth.schema'
import { useSignIn } from '@/features/auth'

const { pending, submit } = useSignIn()

const data = reactive<ISignInSchema>({
  email: '',
  password: '',
})

const FIELD_NAME = {
  email: 'email',
  password: 'password',
} satisfies SchemaToString<ISignInSchema>

function onSubmit(evt: FormSubmitEvent<ISignInSchema>) {
  return submit(evt.data)
}
</script>

<template>
  <div class="p-4 max-w-lg w-full">
    <section class="bg-white rounded-lg p-6 space-y-8">
      <header class="flex flex-col gap-4 items-center text-center">
        <img
          src="/img/syncra-logo.png"
          class="w-14"
        >
        <h1 class="font-medium text-highlighted text-2xl">
          Sign in to Syncra Admin
        </h1>
      </header>

      <UForm
        class="space-y-4"
        :state="data"
        :schema="signInSchema"
        @submit="onSubmit"
      >
        <UFormField
          label="Email Address"
          :name="FIELD_NAME.email"
          required
        >
          <UInput
            v-model="data.email"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Password"
          :name="FIELD_NAME.password"
          required
        >
          <InputPassword v-model="data.password" />
        </UFormField>

        <UButton
          type="submit"
          label="Sign In"
          block
          :loading="pending"
        />
      </UForm>

      <footer class="text-center">
        <NuxtLink
          :to="toRoute('/auth/forgot')"
          class="text-info underline"
        >
          Forgot Password?
        </NuxtLink>
      </footer>
    </section>
  </div>
</template>
