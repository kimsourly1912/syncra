<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as v from 'valibot'
import { PasswordSuggestion } from '@/features/auth'
import { useStaffAccess } from '../composables/useStaffAccess'
import { staffEmailSchema, staffInviteSchema } from '../schemas/staff-access-form'
import type { IStaffInviteSchema } from '../schemas/staff-access-form'

const { invite, inviting, resend, enable, disable, acting } = useStaffAccess()

// Inviting
const INVITE_FIELD = { email: 'email', tempPassword: 'tempPassword', confirmPassword: 'confirmPassword' } satisfies { [K in keyof IStaffInviteSchema]: K }
const blankInvite = () => ({ email: '', tempPassword: '', confirmPassword: '' })
const inviteState = reactive(blankInvite())

async function onInvite(event: FormSubmitEvent<IStaffInviteSchema>) {
  if (await invite(event.data)) Object.assign(inviteState, blankInvite())
}

// Acting on an existing account, by its email. Each action checks the email first.
const account = reactive({ email: '' })
const accountError = ref('')
const confirmDisable = ref(false)

function checkedEmail() {
  const result = v.safeParse(staffEmailSchema, account)
  accountError.value = result.success ? '' : result.issues[0].message
  return result.success ? result.output : undefined
}
async function run(action: typeof resend) {
  const form = checkedEmail()
  if (form) await action(form)
}
function askDisable() {
  if (checkedEmail()) confirmDisable.value = true
}
async function onConfirmDisable() {
  confirmDisable.value = false
  await run(disable)
}
</script>

<template>
  <div class="space-y-6">
    <UAlert
      icon="lucide:info"
      color="neutral"
      variant="subtle"
      title="Staff accounts are managed by email"
      description="Admin can't list staff accounts yet, so enter the email of the account you want to act on. The API decides who may make these changes."
    />

    <UPageCard
      title="Invite a staff member"
      description="They get an email to sign in to Admin with this temporary password, then choose their own."
      variant="outline"
    >
      <UForm
        :schema="staffInviteSchema"
        :state="inviteState"
        :disabled="inviting"
        class="space-y-5"
        @submit="onInvite"
      >
        <UFormField
          label="Work email"
          :name="INVITE_FIELD.email"
        >
          <UInput
            v-model="inviteState.email"
            type="email"
            autocomplete="off"
            placeholder="name@syncra.app"
            class="w-full"
          />
        </UFormField>
        <div class="grid gap-5 sm:grid-cols-2">
          <UFormField
            label="Temporary password"
            :name="INVITE_FIELD.tempPassword"
          >
            <InputPassword
              v-model="inviteState.tempPassword"
              autocomplete="new-password"
            />
          </UFormField>
          <UFormField
            label="Confirm password"
            :name="INVITE_FIELD.confirmPassword"
          >
            <InputPassword
              v-model="inviteState.confirmPassword"
              autocomplete="new-password"
            />
          </UFormField>
        </div>
        <PasswordSuggestion :value="inviteState.tempPassword" />
        <div class="flex justify-end border-t border-default pt-4">
          <UButton
            type="submit"
            label="Send invitation"
            icon="lucide:send"
            :loading="inviting"
          />
        </div>
      </UForm>
    </UPageCard>

    <UPageCard
      title="Existing account"
      description="Send the invitation again, or turn a staff member's sign-in off or back on."
      variant="outline"
    >
      <div class="space-y-4">
        <UFormField
          label="Staff email"
          name="email"
          :error="accountError || undefined"
        >
          <UInput
            v-model="account.email"
            type="email"
            autocomplete="off"
            placeholder="name@syncra.app"
            :disabled="acting"
            class="w-full"
            @update:model-value="accountError = ''"
          />
        </UFormField>
        <div class="flex flex-wrap gap-2">
          <UButton
            label="Resend invitation"
            icon="lucide:send"
            color="neutral"
            variant="outline"
            :disabled="acting"
            @click="run(resend)"
          />
          <UButton
            label="Enable sign-in"
            icon="lucide:user-check"
            color="neutral"
            variant="outline"
            :disabled="acting"
            @click="run(enable)"
          />
          <UButton
            label="Disable sign-in"
            icon="lucide:user-x"
            color="error"
            variant="outline"
            :disabled="acting"
            @click="askDisable"
          />
        </div>
      </div>
    </UPageCard>

    <ModalConfirm
      v-model="confirmDisable"
      title="Disable sign-in?"
      @confirm="onConfirmDisable"
    >
      <template #description>
        <strong class="text-highlighted">{{ account.email.trim() }}</strong> won't be able to sign in to Admin until their sign-in is enabled again.
      </template>
    </ModalConfirm>
  </div>
</template>
