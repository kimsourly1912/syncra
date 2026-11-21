<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { SchemaToString } from '@/types/common'
import { changePasswordSchema } from '@/schema/auth.schema'
import type { IChangePasswordSchema } from '@/schema/auth.schema'
import { confirmReset } from '@/services/auth.service'

const auth = useAuth()
const route = useRoute()
const toast = useAppToast()

const pending = shallowRef(false)
const success = shallowRef(false)
const token = route.query.token as string

const data = reactive<IChangePasswordSchema>({
  newPassword: '',
  confirmPassword: '',
})

const FIELD_NAME = {
  newPassword: 'newPassword',
  confirmPassword: 'confirmPassword',
} satisfies SchemaToString<IChangePasswordSchema>

async function onSubmit(evt: FormSubmitEvent<IChangePasswordSchema>) {
  if (!token) {
    toast.failed('No token provided')
    return
  }

  pending.value = true
  const { newPassword } = evt.data
  try {
    await confirmReset({ token, newPassword })
    auth.onSuccess(() => {
      success.value = true
    })
  }
  catch (e) {
    toast.exception(e)
  }
  finally {
    pending.value = false
  }
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
          Password Changed
        </p>
        <UButton
          label="Continue to Syncra Admin"
          block
          :to="toRoute('/')"
        />
      </section>
    </template>

    <template v-else>
      <section class="bg-white rounded-lg p-6 space-y-8">
        <header class="flex flex-col gap-4 items-center text-center">
          <NuxtImg
            src="/img/syncra-logo.png"
            class="w-14"
          />
          <h1 class="font-medium text-highlighted text-2xl">
            Change Your Password
          </h1>
        </header>

        <UForm
          class="space-y-4"
          :state="data"
          :schema="changePasswordSchema"
          @submit="onSubmit"
        >
          <UFormField
            label="New Password"
            :name="FIELD_NAME.newPassword"
            required
          >
            <InputPassword v-model="data.newPassword" />
          </UFormField>

          <FormPasswordSuggestion :value="data.newPassword" />

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
