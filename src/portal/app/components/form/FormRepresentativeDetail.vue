<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { phoneCodes } from '@/data/common.data'
import { representativeSchema } from '@/schema/onboarding.schema'
import type { IRepresentativeSchema } from '@/schema/onboarding.schema'

defineProps<{
  loading?: boolean
  fieldName: IRepresentativeSchema
}>()

defineEmits<{
  submit: [data: FormSubmitEvent<IRepresentativeSchema>]
}>()

const state = defineModel<IRepresentativeSchema>('state', { required: true })
</script>

<template>
  <UForm
    :state
    :schema="representativeSchema"
    class="space-y-8"
    @submit="data => $emit('submit', data)"
  >
    <section class="grid md:grid-cols-2 gap-4">
      <UFormField
        label="First Name"
        :name="fieldName.firstName"
        required
      >
        <UInput
          v-model="state.firstName"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Last Name"
        :name="fieldName.lastName"
        required
      >
        <UInput
          v-model="state.lastName"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Role/Position"
        :name="fieldName.rolePosition"
        required
      >
        <UInput
          v-model="state.rolePosition"
          class="w-full"
        />
      </UFormField>

      <InputPhoneNumber
        v-model:phone="state.phone"
        v-model:phone-code="state.code"
        label="Phone Number"
        required
        :options="phoneCodes"
        :name="{
          phone: fieldName.phone,
          phoneCode: fieldName.code,
        }"
      />
    </section>
    <UFormField
      label="Email Address"
      :name="fieldName.email"
      required
    >
      <UInput
        v-model="state.email"
        class="w-full"
      />
    </UFormField>

    <footer class="text-right flex justify-end gap-2">
      <UButton
        :loading
        type="submit"
        label="Continue"
      />
    </footer>
  </UForm>
</template>
