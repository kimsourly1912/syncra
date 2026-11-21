<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import CardHeading from '@/features/invite/components/CardHeading.vue'
import * as authService from '@/services/auth.service'
import type { ProfileDTO, AuthDTO } from '@/types/dto'
import * as profileService from '@/services/profile.service'
import { signUpByInvitationSchema, signUpByInvitationUpdateProfileSchema, signUpByInvitationConfirmPasswordSchema } from '@/schema/invite.schema'
import type { ISignUpByInvitationConfirmPasswordSchema, ISignUpByInvitationSchema, ISignUpByUpdateProfileSchema } from '@/schema/invite.schema'

type State = 'START' | 'SET_PASSWORD' | 'COMPLETE_PROFILE' | 'SUCCESS'

interface OpenItem {
  needHelp: boolean
}

const route = useRoute()
const { toast } = useAppToast()
const profileStore = useProfileStore()

const state = shallowRef<State>('START')
const emailQuery = (route.query.email ?? '') as string

const open = reactive<OpenItem>({
  needHelp: false,
})

const inviteEmail = inviteEmailProps()
const updateProfile = updateProfileProps()
const confirmPassword = confirmPasswordProps()
inviteEmail.data.email = emailQuery

function inviteEmailProps() {
  const data = reactive<ISignUpByInvitationSchema>({
    email: '',
    password: '',
  })

  const FIELD_NAME = {
    email: 'email',
    password: 'password',
  } satisfies ISignUpByInvitationSchema

  const { execute, pending, clear } = useAsyncData(() => signUpByInvitation({ email: data.email, temporaryPassword: data.password }), { immediate: false })

  async function signUpByInvitation(req: AuthDTO.SignUpByInvitationReq) {
    try {
      const { success, reason, data } = await authService.signUpByInvitation(req)
      if (success) {
        state.value = 'SET_PASSWORD'
        confirmPassword.username.value = data.email
        confirmPassword.session.value = data.sessionId
        toast.add('success', { title: 'Success', description: reason })
      }
      else {
        toast.add('error', { title: 'Failed', description: reason })
      }
    }
    catch (e) {
      toast.addException(e)
    }
  }

  function submit(_: FormSubmitEvent<ISignUpByInvitationSchema>) {
    execute()
  }

  function clearAll() {
    clear()
    data.email = ''
    data.password = ''
  }

  return {
    data,
    pending,
    FIELD_NAME,
    clearAll,
    submit,
    execute,
    signUpByInvitation,
  }
}

function confirmPasswordProps() {
  const data = reactive<ISignUpByInvitationConfirmPasswordSchema>({
    password: '',
    confirmPassword: '',
  })

  const username = shallowRef('')
  const session = shallowRef('')

  const FIELD_NAME = {
    password: 'password',
    confirmPassword: 'confirmPassword',
  } satisfies ISignUpByInvitationConfirmPasswordSchema

  const { execute, pending, clear } = useAsyncData(() => signUpByInvitationConfirmPassword({ username: username.value, newPassword: data.password, session: session.value }), { immediate: false })

  async function signUpByInvitationConfirmPassword(req: AuthDTO.SignUpByInvitationConfirmPasswordReq) {
    try {
      const { success, reason, data } = await authService.signUpByInvitationConfirmPassword(req)
      if (success) {
        state.value = 'COMPLETE_PROFILE'
        profileStore.execute()
        toast.add('success', { title: 'Success', description: reason })
      }
      else {
        toast.add('error', { title: 'Failed', description: reason })
      }
    }
    catch (e) {
      toast.addException(e)
    }
  }

  function submit(_: FormSubmitEvent<ISignUpByInvitationConfirmPasswordSchema>) {
    execute()
  }

  function clearAll() {
    clear()
    session.value = ''
    username.value = ''
    data.password = ''
    data.confirmPassword = ''
  }

  return {
    data,
    pending,
    FIELD_NAME,
    username,
    session,
    clearAll,
    submit,
    execute,
    signUpByInvitationConfirmPassword,
  }
}

function updateProfileProps() {
  const data = reactive<ISignUpByUpdateProfileSchema>({
    firstName: '',
    lastName: '',
  })

  const FIELD_NAME = {
    firstName: 'firstName',
    lastName: 'lastName',
  } satisfies ISignUpByUpdateProfileSchema

  const { execute, pending, clear } = useAsyncData(() => updateProfile({ firstName: data.firstName, lastName: data.lastName }), { immediate: false })

  async function updateProfile(req: ProfileDTO.UpdateProfileReq) {
    try {
      const { success, reason } = await profileService.updateProfile(req)
      if (success) {
        state.value = 'SUCCESS'
        await profileStore.execute()
      }
      else {
        toast.add('error', { title: 'Failed', description: reason })
      }
    }
    catch (e) {
      toast.addException(e)
    }
  }

  function submit(_: FormSubmitEvent<ISignUpByUpdateProfileSchema>) {
    execute()
  }

  function clearAll() {
    clear()
    data.firstName = ''
    data.lastName = ''
  }

  return {
    data,
    pending,
    FIELD_NAME,
    clearAll,
    submit,
    execute,
    updateProfile,
  }
}

useHead({
  titleTemplate: 'Invite - %s',
})
</script>

<template>
  <div class="w-full max-w-xl">
    <UPageCard>
      <template v-if="state === 'START'">
        <CardHeading
          title="Welcome to Syncra"
          description="You've been invited to join your organization's workspace. Enter your temporary password to continue."
        />

        <UForm
          :state="inviteEmail.data"
          :schema="signUpByInvitationSchema"
          class="flex flex-col gap-4 mt-10 mb-4"
          @submit="inviteEmail.submit"
        >
          <UFormField
            label="Email"
            required
            :name="inviteEmail.FIELD_NAME.email"
          >
            <UInput
              v-model="inviteEmail.data.email"
              disabled
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Password"
            required
            :name="inviteEmail.FIELD_NAME.password"
          >
            <InputPassword v-model="inviteEmail.data.password" />
          </UFormField>

          <UButton
            type="submit"
            block
            color="neutral"
            :loading="inviteEmail.pending.value"
          >
            Continue
          </UButton>
        </UForm>

        <UButton
          variant="link"
          color="info"
          class="underline text-center"
          block
          label="Need Help?"
          @click="open.needHelp = true"
        />
      </template>

      <template v-if="state === 'SET_PASSWORD'">
        <CardHeading
          title="Set Your New Password"
          description="To secure your account, please create a new password."
        />

        <UForm
          :state="confirmPassword.data"
          :schema="signUpByInvitationConfirmPasswordSchema"
          class="flex flex-col gap-4 mt-10"
          @submit="confirmPassword.submit"
        >
          <UFormField
            label="New Password"
            :name="confirmPassword.FIELD_NAME.password"
            required
          >
            <InputPassword v-model="confirmPassword.data.password" />
          </UFormField>

          <PasswordSuggestionMessage :value="confirmPassword.data.password" />

          <UFormField
            label="Confirm Password"
            :name="confirmPassword.FIELD_NAME.confirmPassword"
            required
          >
            <InputPassword v-model="confirmPassword.data.confirmPassword" />
          </UFormField>

          <UButton
            type="submit"
            block
            color="neutral"
            :loading="confirmPassword.pending.value"
          >
            Continue
          </UButton>
        </UForm>
      </template>

      <template v-if="state === 'COMPLETE_PROFILE'">
        <CardHeading
          title="Complete Your Profile"
          description="Let your team recognize you with your basic information."
        />

        <UForm
          :state="updateProfile.data"
          :schema="signUpByInvitationUpdateProfileSchema"
          class="flex flex-col gap-4 mt-10"
          @submit="updateProfile.submit"
        >
          <UFormField
            label="First Name"
            required
            :name="updateProfile.FIELD_NAME.firstName"
          >
            <UInput
              v-model="updateProfile.data.firstName"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Last Name"
            required
            :name="updateProfile.FIELD_NAME.lastName"
          >
            <UInput
              v-model="updateProfile.data.lastName"
              class="w-full"
            />
          </UFormField>

          <footer>
            <UButton
              type="submit"
              block
              :loading="updateProfile.pending.value"
              color="neutral"
            >
              Continue
            </UButton>
            <p class="text-sm text-muted text-center mt-4">
              Your name will appear on team activity logs.
            </p>
          </footer>
        </UForm>
      </template>

      <template v-if="state === 'SUCCESS'">
        <main class="flex flex-col gap-10 items-center">
          <ModalHeading
            title="Password Updated Successfully"
            icon="lucide:circle-check"
            color="success"
            description="Your Syncra account is now ready to use"
          />

          <footer class="w-full">
            <UButton
              label="Continue to Workspace"
              block
              color="neutral"
              :to="toRoute('/')"
            />
          </footer>
        </main>
      </template>
    </UPageCard>

    <UModal
      v-model:open="open.needHelp"
      class="max-w-xl p-10"
    >
      <template #title />
      <template #description />
      <template #content="{ close }">
        <main class="flex flex-col gap-10 items-center">
          <ModalHeading
            title="Need Help?"
            icon="lucide:info"
          >
            <template #description="{ item }">
              <p :class="item.description">
                If your temporary password isn't working or your invitation link has expired, please contact your workspace administrator to resend your invitation.
                <span class="mt-2 block">
                  If you need further assistance, reach out to Syncra support.
                </span>
              </p>
            </template>
          </ModalHeading>

          <footer class="w-full">
            <UButton
              label="Close"
              variant="outline"
              block
              color="neutral"
              @click="close"
            />
          </footer>
        </main>
      </template>
    </UModal>
  </div>
</template>
