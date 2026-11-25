<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { FIELD_NAME } from '@/data/auth.data'
import { phoneCodes } from '@/data/common.data'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import { signUpEmailSchema, signUpPhoneSchema } from '@/schema/auth.schema'
import type { ISignUpEmailSchema, ISignUpPhoneSchema } from '@/schema/auth.schema'

const { oAuthItems } = useOAuth()
const { hideSocialLogin } = useFeatureFlags()
const { emailProps, phoneProps } = useSignUp()
const { selectedTab, authCredential } = useAuth()
const signUpEmail = emailProps()
const signUpPhone = phoneProps()
const { fromEdit } = useAppState()

const username = computed(() => authCredential.value?.username ?? '')
const isEmail = computed(() => authCredential.value?.signType === 'email')

function submitEmail(_: FormSubmitEvent<ISignUpEmailSchema>) {
  signUpEmail.execute()
}

function submitPhone(_: FormSubmitEvent<ISignUpPhoneSchema>) {
  signUpPhone.execute()
}

watch(selectedTab, () => {
  signUpEmail.clear()
  signUpPhone.clear()
})

watch(fromEdit, (v) => {
  if (v) {
    if (isEmail.value) {
      signUpEmail.data.email = username.value
    }
    else {
      /**
       * skip for phone number
       * use the default set
       */
    }
  }
}, { immediate: true })

useHead({
  titleTemplate: 'Sign Up - %s',
})
</script>

<template>
  <UPageCard class="w-full max-w-lg">
    <header class="space-y-3">
      <span class="text-dimmed font-medium text-sm">Step 1 of 2</span>
      <h1 class="text-3xl font-semibold text-highlighted">
        Create an account
      </h1>
      <div>
        <span class="text-muted">Already have an account?</span>
        <UButton
          :to="toRoute('/auth/sign-in')"
          label="Sign In"
          color="info"
          variant="link"
          class="underline"
        />
      </div>
    </header>

    <AuthTabs v-model="selectedTab">
      <template #email>
        <UForm
          ref="form-email-ref"
          :state="signUpEmail.data"
          :schema="signUpEmailSchema"
          class="flex flex-col gap-4 mt-4"
          :validate-on="[]"
          @submit="submitEmail"
        >
          <UFormField
            label="Email"
            :name="FIELD_NAME.email"
            required
          >
            <UInput
              v-model="signUpEmail.data.email"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Password"
            :name="FIELD_NAME.password"
            required
          >
            <InputPassword v-model="signUpEmail.data.password" />
          </UFormField>

          <PasswordSuggestionMessage :value="signUpEmail.data.password" />

          <UFormField
            label="Comfirm Password"
            :name="FIELD_NAME.confirmPassword"
            required
          >
            <InputPassword v-model="signUpEmail.data.confirmPassword" />
          </UFormField>

          <UButton
            type="submit"
            block
            color="neutral"
            :loading="signUpEmail.pending.value"
          >
            Continue
          </UButton>
        </UForm>
      </template>

      <template #phone>
        <UForm
          ref="form-phone-ref"
          :state="signUpPhone.data"
          :schema="signUpPhoneSchema"
          class="flex flex-col gap-4 mt-4"
          :validate-on="[]"
          @submit="submitPhone"
        >
          <InputPhoneNumber
            v-model:phone-code="signUpPhone.data.code"
            v-model:phone="signUpPhone.data.phone"
            label="Phone number"
            required
            :name="{
              phoneCode: 'code',
              phone: FIELD_NAME.phone,
            }"
            :options="phoneCodes"
          />

          <UFormField
            label="Password"
            :name="FIELD_NAME.password"
            required
          >
            <InputPassword v-model="signUpPhone.data.password" />
          </UFormField>

          <PasswordSuggestionMessage :value="signUpPhone.data.password" />

          <UFormField
            label="Comfirm Password"
            :name="FIELD_NAME.confirmPassword"
            required
          >
            <InputPassword v-model="signUpPhone.data.confirmPassword" />
          </UFormField>

          <UButton
            type="submit"
            block
            color="neutral"
            :loading="signUpPhone.pending.value"
          >
            Continue
          </UButton>
        </UForm>
      </template>
    </AuthTabs>

    <div class="text-muted text-sm">
      By Clicking Create account, I agree that I have read and accepted the
      <ULink
        to="/policy/terms"
        target="_blank"
        class="underline"
      >Terms of Use</ULink> and
      <ULink
        to="/policy/privacy"
        class="underline"
        target="_blank"
      >Privacy Policy</ULink>.
    </div>
    <template v-if="!hideSocialLogin">
      <USeparator
        label="or"
        class="my-3"
      />
      <SocialMediaItem :items="oAuthItems" />
    </template>
  </UPageCard>
</template>
