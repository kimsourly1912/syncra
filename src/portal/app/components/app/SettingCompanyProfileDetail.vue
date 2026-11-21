<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])
const form = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const onSave = () => {
  emit('change')
}
</script>

<template>
  <UCard class="rounded-2xl">
    <main>
      <section class="space-y-6">
        <div class="grid grid-cols-2 flex-col-1 items-end gap-4 ">
          <div class="flex flex-col">
            <h1 class="text-sm xl:text-2xl font-semibold">
              Company Details
            </h1>
            <p>
              Update your company details
            </p>
          </div>
          <div class="flex justify-end pt-4">
            <UButton
              class="px-6 py-2 text-md text-primary active:bg-accented border border-accented hover:bg-accented bg-transparent dark:text-[#ffffff]"
              label="Edit Profile"
              @click="onSave"
            />
          </div>
        </div>
        <div class="bg-[#4ba0b81a] space-y-2 rounded-2xl p-4">
          <div class="grid grid-cols-2 flex-col-1 items-end gap-4 ">
            <UFormField
              label="Company Name"
            >
              <h2 class=" text-sm xl:text-md font-bold py-2">
                {{ form.companyName }}
              </h2>
            </UFormField>
            <UFormField
              label="Company Email Address"
            >
              <h2 class=" text-sm xl:text-md font-bold py-2">
                {{ form.companyEmailAddress }}
              </h2>
            </UFormField>
            <UFormField
              label="Industry Type"
            >
              <h2 class=" text-sm xl:text-md font-bold py-2">
                {{ form.industryType }}
              </h2>
            </UFormField>
            <UFormField
              label="Company Size"
            >
              <h2 class=" text-sm xl:text-md font-bold py-2">
                {{ form.companySize }}
              </h2>
            </UFormField>
            <UFormField
              label="Country/Region"
            >
              <h2 class=" text-sm xl:text-md font-bold py-2">
                {{ form.countryRegion }}
              </h2>
            </UFormField>
            <UFormField
              label="Company Contact"
            >
              <h2 class=" text-sm xl:text-md font-bold py-2">
                {{ form.contactCountryCode }} {{ form.companyContact }}
              </h2>
            </UFormField>
            <UFormField
              label="Company Address"
            >
              <h2 class=" text-sm xl:text-md font-bold py-2">
                {{ form.companyAddress }}
              </h2>
            </UFormField>
          </div>
        </div>
      </section>
    </main>
  </UCard>
</template>
