<script lang="ts" setup>
import { FIELD_NAME } from '@/data/auth.data'
import { phoneCodes } from '@/data/common.data'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useFeatureFlags } from '~/composables/useFeatureFlags'
import { signInEmailSchema, signInPhoneSchema } from '@/schema/auth.schema'
import type { ISignInEmailSchema, ISignInPhoneSchema } from '@/schema/auth.schema'

const { selectedTab, setCookie } = useAuth()
const profileStore = useProfileStore()

setCookie(null)

const { oAuthItems } = useOAuth()
const { emailProps, phoneProps } = useSignIn()
const { hideSocialLogin } = useFeatureFlags()

const signEmail = emailProps()
const signPhone = phoneProps()

function submitEmail(_: FormSubmitEvent<ISignInEmailSchema>) {
  signEmail.execute()
}

function submitPhone(_: FormSubmitEvent<ISignInPhoneSchema>) {
  signPhone.execute()
}

watch(selectedTab, () => {
  signEmail.clear()
  signPhone.clear()
})

useHead({
  titleTemplate: 'Sign In - %s',
})
</script>

<template>
  <UPageCard class="w-full max-w-lg">
    <header>
      <h1 class="text-3xl font-semibold text-highlighted">
        Sign In
      </h1>
      <div class="mt-2">
        <span class="text-muted">New User?</span>
        <UButton
          :to="toRoute('/auth/sign-up')"
          label="Create an account"
          color="info"
          variant="link"
          class="underline"
        />
      </div>
    </header>

    <AuthTabs v-model="selectedTab">
      <template #email>
        <UForm
          :state="signEmail.data"
          :schema="signInEmailSchema"
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
              v-model="signEmail.data.email"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Password"
            :name="FIELD_NAME.password"
            required
          >
            <InputPassword v-model="signEmail.data.password" />
          </UFormField>

          <UButton
            type="submit"
            block
            color="neutral"
            :loading="signEmail.pending.value || profileStore.pending"
          >
            Continue
          </UButton>
        </UForm>
      </template>

      <template #phone>
        <UForm
          ref="form-phone-ref"
          :state="signPhone.data"
          :schema="signInPhoneSchema"
          class="flex flex-col gap-4 mt-4"
          :validate-on="[]"
          @submit="submitPhone"
        >
          <InputPhoneNumber
            v-model:phone-code="signPhone.data.code"
            v-model:phone="signPhone.data.phone"
            label="Phone number"
            required
            :name="{
              phone: FIELD_NAME.phone,
              phoneCode: 'code',
            }"
            :options="phoneCodes"
          />

          <UFormField
            label="Password"
            :name="FIELD_NAME.password"
            required
          >
            <InputPassword v-model="signPhone.data.password" />
          </UFormField>

          <UButton
            type="submit"
            block
            color="neutral"
            :loading="signPhone.pending.value || profileStore.pending"
          >
            Continue
          </UButton>
        </UForm>
      </template>
    </AuthTabs>

    <template v-if="!hideSocialLogin">
      <USeparator
        label="or"
        class="my-3"
      />
      <SocialMediaItem :items="oAuthItems" />
    </template>

    <UButton
      label="Get help Signing in?"
      :to="toRoute('/auth/forgot-password')"
      class="underline"
      color="info"
      variant="link"
    />
  </UPageCard>
</template>
