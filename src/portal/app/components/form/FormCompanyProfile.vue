<script setup lang="ts">
import countriesJson from '~/assets/data/countries.json'
import type { InputPhoneNumberOption } from '@/components/base/InputPhoneNumber.vue'

const phoneCodeOptions: (InputPhoneNumberOption)[] = countriesJson.map(Country => ({ label: Country.dial_code })) as (InputPhoneNumberOption)[]
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancal'])
const form = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
</script>

<template>
  <UCard class="p-2 rounded-2xl">
    <div>
      <h2 class="text-2xl font-semibold">
        Company Details
      </h2>
      <p class="text-gray-500 mt-1">
        Update your company details
      </p>
    </div>
    <UForm
      :state="form"
      class="mt-8 space-y-6"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UFormField label="Company Name">
          <UInput
            v-model="form.companyName"
            class="w-full"
            placeholder="Enter company name"
          />
        </UFormField>

        <UFormField
          label="Company Email Address"
        >
          <UInput
            v-model="form.companyEmailAddress"
            class="w-full"
            placeholder="company@email.com"
          />
        </UFormField>

        <UFormField label="Industry Type">
          <UInput
            v-model="form.industryType"
            class="w-full"
            placeholder="Garment Industry"
          />
        </UFormField>

        <UFormField label="Company Size">
          <UInput
            v-model="form.companySize"
            class="w-full"
            placeholder="50 (Medium)"
          />
        </UFormField>

        <UFormField label="Country/Region">
          <UInput
            v-model="form.countryRegion"
            class="w-full"
            placeholder="Cambodia"
          />
        </UFormField>

        <InputPhoneNumber
          v-model:phone="form.companyContact"
          v-model:phone-code="form.contactCountryCode"
          label="Contact Number"
          :name="{
            phone: 'phoneNumber',
            phoneCode: 'phone-code',
          }"
          :options="phoneCodeOptions"
        />
      </div>

      <UFormField label="Company Address">
        <UInput
          v-model="form.companyAddress"
          class="w-full"
          placeholder="Enter full company address"
        />
      </UFormField>

      <div class="flex justify-end pt-4 gap-4">
        <UButton
          class="px-6 py-2 text-md border border-[#8DA1A5] bg-transparent hover:bg-accented text-[#8DA1A5] dark:text-[#ffffff]"
          @click="emit('cancal')"
        >
          Cancel
        </UButton>
        <UButton
          class="px-6 py-2"
          @click=" emit('save', form.value)"
        >
          Save Changes
        </UButton>
      </div>
    </UForm>
  </UCard>
  <div class="h-10" />
</template>
