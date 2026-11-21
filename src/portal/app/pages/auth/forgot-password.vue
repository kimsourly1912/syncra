<script setup lang="ts">
import { phoneCodes } from '@/data/common.data'
import { FIELD_NAME, CODE_LENGTH } from '@/data/auth.data'

const {
  show,
  signOTP,
  signEmail,
  signPhone,
  selectedTab,
  signPassword,
  asyncDataPassword,
  asyncDataCodePhone,
  asyncDataCodeEmail,
  clearAll,
  resendOTP,
  handleOpenReset,
} = useForgotPassword()

watch(selectedTab, () => clearAll())

watch(() => show.otp, () => {
  signOTP.code.value = []
})

useHead({
  titleTemplate: 'Forgot Password - %s',
})
</script>

<template>
  <UPageCard class="w-full max-w-lg">
    <template v-if="!show.reset">
      <header>
        <h1 class="text-3xl font-semibold text-highlighted">
          Get help
        </h1>
        <p class="text-muted mt-2">
          If you're having issues signing in, try the following options.
        </p>
      </header>

      <section class="pt-10">
        <UButton
          label="Reset your password"
          icon="lucide:key-round"
          trailing-icon="lucide:chevron-right"
          block
          size="xl"
          color="neutral"
          variant="outline"
          :ui="{
            base: 'py-4 px-6',
          }"
          @click="handleOpenReset"
        />
      </section>
    </template>

    <template v-if="show.reset && !show.otp">
      <header>
        <h1 class="text-3xl font-semibold text-highlighted">
          Enter your Email address or phone Number
        </h1>
        <p class="text-muted mt-4">
          To reset your password, please enter your email address or phone number you may have use with syncra.
        </p>
      </header>

      <AuthTabs v-model="selectedTab">
        <template #email>
          <UForm
            :state="signEmail.data"
            :schema="signEmail.schema"
            class="flex flex-col gap-4 mt-4"
            @submit="asyncDataCodeEmail.execute"
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

            <UButton
              type="submit"
              block
              color="neutral"
              :loading="asyncDataCodeEmail.pending.value"
            >
              Continue
            </UButton>
          </UForm>
        </template>

        <template #phone>
          <UForm
            :state="signPhone.data"
            :schema="signPhone.schema"
            class="flex flex-col gap-4 mt-4"
            @submit="asyncDataCodePhone.execute"
          >
            <InputPhoneNumber
              v-model:phone-code="signPhone.data.code"
              v-model:phone="signPhone.data.phone"
              label="Phone number"
              required
              :name="{
                phoneCode: 'code',
                phone: FIELD_NAME.phone,
              }"
              :options="phoneCodes"
            />
            <UButton
              type="submit"
              block
              color="neutral"
              :loading="asyncDataCodePhone.pending.value"
            >
              Continue
            </UButton>
          </UForm>
        </template>
      </AuthTabs>
    </template>

    <template v-if="show.otp && !show.confirm">
      <section class="flex flex-col gap-4">
        <header class="space-y-3">
          <h1 class="text-3xl font-semibold text-highlighted">
            {{ selectedTab === 'email' ? 'Verify your email' : 'Verify your phone number' }}
          </h1>
          <section class="text-sm">
            <p class="text-muted text">
              We've sent a verification code to:
            </p>
            <div>
              <span class="font-medium">
                {{ signOTP.username.value }}
              </span>
              <UButton
                label="Edit"
                color="info"
                variant="link"
                class="underline"
                @click="show.otp = false"
              />
            </div>
          </section>
        </header>

        <UForm
          :state="signOTP.data"
          :schema="signOTP.schema"
          @submit="show.confirm = true"
        >
          <VerifyCode
            v-model="signOTP.code.value"
            :name="FIELD_NAME.otp"
            :length="CODE_LENGTH"
            :loading="asyncDataPassword.pending.value"
            :loading-resend="asyncDataCodeEmail.pending.value || asyncDataCodePhone.pending.value"
            @resend="resendOTP"
          />
        </UForm>
      </section>
    </template>

    <template v-if="show.confirm && !show.success">
      <header>
        <h1 class="text-3xl font-semibold text-highlighted mb-4">
          Update your password
        </h1>
      </header>

      <UForm
        autocomplete="off"
        :state="signPassword.data"
        :schema="signPassword.schema"
        class="flex flex-col gap-4"
        @submit="asyncDataPassword.execute"
      >
        <UFormField
          label="New Password"
          :name="FIELD_NAME.newPassword"
          required
        >
          <InputPassword v-model="signPassword.data.newPassword" />
        </UFormField>

        <PasswordSuggestionMessage :value="signPassword.data.newPassword" />

        <UFormField
          label="Confirm Password"
          :name="FIELD_NAME.confirmPassword"
          required
        >
          <InputPassword v-model="signPassword.data.confirmPassword" />
        </UFormField>

        <UButton
          type="submit"
          block
          color="neutral"
          :loading="asyncDataPassword.pending.value"
        >
          Update Password
        </UButton>
      </UForm>
    </template>

    <template v-if="show.success">
      <header>
        <h1 class="text-3xl font-semibold text-highlighted mb-8">
          Password updated successfully
        </h1>
        <p class="text-muted mt-4">
          Your password has been changed. You can now sign in with your new credentials.
        </p>
      </header>

      <footer class="mt-10">
        <UButton
          type="submit"
          block
          color="neutral"
          :to="toRoute('/auth/sign-in')"
        >
          Continue
        </UButton>
      </footer>
    </template>

    <footer
      v-if="!show.success"
      class="pt-48"
    >
      <USeparator />
      <div class="py-5">
        <UButton
          label="Return to sign in"
          color="info"
          variant="link"
          class="underline"
          :to="toRoute('/auth/sign-in')"
        />
      </div>
    </footer>
  </UPageCard>
</template>
