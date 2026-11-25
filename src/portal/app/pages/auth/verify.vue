<script setup lang="ts">
import { signUpOtpSchema } from '@/schema/auth.schema'
import { CODE_LENGTH, FIELD_NAME } from '@/data/auth.data'

const {
  code,
  data,
  isEmail,
  username,
  pendingAll,
  isFromSignUp,
  handleResend,
  handleSubmit,
} = useOTP()
const { fromEdit, reset } = useAppState()

onUnmounted(() => reset())
</script>

<template>
  <UPageCard class="w-full max-w-lg">
    <section class="flex flex-col gap-4">
      <VerifyCodeMessage
        :title="isEmail ? 'Verify your email' : 'Verify your phone number'"
        :username
        :editable="isFromSignUp"
        :to="toRoute('/auth/sign-up')"
        @edit="fromEdit = true"
      />

      <UForm
        :state="data"
        :schema="signUpOtpSchema"
        :validate-on="[]"
        @submit="handleSubmit"
      >
        <VerifyCode
          v-model="code"
          :name="FIELD_NAME.otp"
          :length="CODE_LENGTH"
          :loading="pendingAll"
          :loading-resend="pendingAll"
          @resend="handleResend"
        />
      </UForm>
    </section>
  </UPageCard>
</template>
