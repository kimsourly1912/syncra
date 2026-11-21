<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { industries, countries, companySizes, phoneCodes } from '@/data/common.data'
import { companySchema } from '@/schema/onboarding.schema'
import type { ICompanySchema } from '@/schema/onboarding.schema'

defineProps<{
  loading?: boolean
  fieldName: ICompanySchema
}>()

defineEmits<{
  submit: [data: FormSubmitEvent<ICompanySchema>]
}>()

const state = defineModel<ICompanySchema>('state', { required: true })
</script>

<template>
  <UForm
    :state
    :schema="companySchema"
    class="space-y-8"
    @submit="data => $emit('submit', data)"
  >
    <main class="space-y-4">
      <section class="grid md:grid-cols-2 gap-4">
        <UFormField
          label="Company Name"
          :name="fieldName.name"
          required
        >
          <UInput
            v-model="state.name"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Company Email Address"
          :name="fieldName.email"
          required
        >
          <UInput
            v-model="state.email"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Industry Type"
          :name="fieldName.industry"
          required
        >
          <USelectMenu
            v-model="state.industry"
            class="w-full"
            :items="industries"
            value-key="value"
          >
            <template #empty>
              No Data
            </template>
          </USelectMenu>
        </UFormField>

        <UFormField
          label="Company Size"
          :name="fieldName.size"
          required
        >
          <USelectMenu
            v-model="state.size"
            class="w-full"
            :items="companySizes"
            value-key="value"
          >
            <template #empty>
              No Data
            </template>
          </USelectMenu>
        </UFormField>

        <UFormField
          label="Country / Region"
          :name="fieldName.country"
          required
        >
          <USelectMenu
            v-model="state.country"
            class="w-full"
            :items="countries"
            value-key="label"
            virtualize
          >
            <template #empty>
              No Data
            </template>
          </USelectMenu>
        </UFormField>

        <InputPhoneNumber
          v-model:phone="state.phone"
          v-model:phone-code="state.code"
          label="Company Contact"
          required
          :options="phoneCodes"
          :name="{
            phone: fieldName.phone,
            phoneCode: fieldName.code,
          }"
        />
      </section>

      <UFormField
        label="Company Address"
        :name="fieldName.address"
        required
      >
        <UTextarea
          v-model="state.address"
          class="w-full"
        />
      </UFormField>
    </main>

    <footer class="text-right flex justify-end gap-2">
      <UButton
        :loading
        type="submit"
        label="Submit"
      />
    </footer>
  </UForm>
</template>
