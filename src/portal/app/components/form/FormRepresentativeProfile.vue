<script setup lang="ts">
import countriesJson from '~/assets/data/countries.json'
import type { InputPhoneNumberOption } from '@/components/base/InputPhoneNumber.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})
const phoneCodeOptions: (InputPhoneNumberOption)[] = countriesJson.map(Country => ({ label: Country.dial_code })) as (InputPhoneNumberOption)[]
const emit = defineEmits(['update:modelValue', 'save', 'cancel'])
const form = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const onSave = () => {
  emit('save', form.value)
}
</script>

<template>
  <UCard class="p-2 rounded-2xl">
    <div>
      <h2 class="text-2xl font-semibold">
        Representative Details
      </h2>
      <p class="text-gray-500 mt-1">
        Update your Representative Details
      </p>
    </div>
    <UForm
      :state="form"
      class="mt-8 space-y-6"
      :validate-on="[]"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UFormField label="First Name">
            <UInput
              v-model="form.firstName"
              class="w-full"
              placeholder="Enter first name"
            />
          </UFormField>

          <UFormField label="Last Name">
            <UInput
              v-model="form.lastName"
              class="w-full"
              placeholder="Enter full name"
            />
          </UFormField>
        </div>
        <UFormField
          label="Work Email Address"
        >
          <UInput
            v-model="form.workEmail"
            class="w-full"
            placeholder="company@email.com"
          />
        </UFormField>
        <UFormField
          label="Role/Position"
        >
          <UInput
            v-model="form.rolePosition"
            class="w-full"
            placeholder="company@email.com"
          />
        </UFormField>
        <InputPhoneNumber
          v-model:phone="form.contactNumber"
          v-model:phone-code="form.countryCode"
          label="Contact Number"
          :name="{
            phone: 'phoneNumber',
            phoneCode: 'phone-code',
          }"
          :options="phoneCodeOptions"
        />
      </div>
      <div class="flex justify-end pt-4 gap-4">
        <UButton
          class="px-6 py-2 text-md border border-[#8DA1A5] bg-transparent hover:bg-accented text-[#8DA1A5] dark:text-[#ffffff]"
          @click="emit('cancel')"
        >
          Cancel
        </UButton>
        <UButton
          class="px-6 py-2"
          @click="onSave"
        >
          Save Changes
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
