<script lang="ts" setup>
import * as v from 'valibot'
import type { ModuleDTO } from '@/types/dto'
import { phoneCodes } from '@/assets/data/data'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { IContactSaleSchema } from '@/schema/contact-sale.schema'
import { contactSaleSchema, MAX_WORD } from '@/schema/contact-sale.schema'

const { FIELD_NAME } = useContactSale()

defineEmits<{
  submit: [evt: FormSubmitEvent<IContactSaleSchema>]
}>()

const data = defineModel<IContactSaleSchema>('data', { required: true })

const props = withDefaults(defineProps<{
  pending?: boolean
  moduleItems?: ModuleDTO.ModuleData[]
}>(), {
  moduleItems() {
    return []
  },
})

const moduleItems = computed(() => {
  return props.moduleItems.map(o => ({
    label: o.name,
    value: String(o.id),
    iconUrl: o.iconUrl,
  }))
})

const wordCount = computed(() => v._getWordCount('en', data.value.helpWith))
</script>

<template>
  <UForm
    :state="data"
    :schema="contactSaleSchema"
    class="flex flex-col gap-5"
    @submit="evt => $emit('submit', evt)"
  >
    <section class="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <UFormField
        label="Name"
        :name="FIELD_NAME.name"
        required
      >
        <UInput
          v-model="data.name"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Company Name"
        :name="FIELD_NAME.companyName"
        required
      >
        <UInput
          v-model="data.companyName"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Email"
        :name="FIELD_NAME.email"
        required
      >
        <UInput
          v-model="data.email"
          class="w-full"
        />
      </UFormField>

      <InputPhoneNumber
        v-model:phone="data.phone"
        v-model:phone-code="data.phoneCode"
        required
        label="Phone Number"
        :name="{
          phone: FIELD_NAME.phone,
          phoneCode: FIELD_NAME.phoneCode,
        }"
        :options="phoneCodes"
      />
    </section>

    <template v-if="moduleItems.length > 0">
      <UFormField
        :name="FIELD_NAME.modules"
        required
        class="py-5"
        label="Select Your Interested Modules"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <label
            v-for="item in moduleItems"
            :key="item.value"
            class="flex items-center justify-between py-2 px-3 rounded-lg border cursor-pointer transition-colors border-default"
            :class="data.modules.includes(item.value) ? 'border-primary bg-primary/5' : ''"
          >
            <div class="flex items-center gap-2">
              <div class="w-12 h-12 flex flex-col items-center justify-center rounded-md bg-gray-50">
                <NuxtImg
                  :src="item.iconUrl"
                  class="min-w-7"
                />
              </div>
              <span class="text-xs">{{ item.label }}</span>
            </div>
            <UCheckbox
              :model-value="data.modules.includes(item.value)"
              @update:model-value="(checked: boolean) => {
                if (checked) data.modules.push(item.value)
                else data.modules = data.modules.filter(v => v !== item.value)
              }"
            />
          </label>
        </div>
      </UFormField>
    </template>

    <UFormField
      label="What can we help you with?"
      :name="FIELD_NAME.helpWith"
    >
      <template #description>
        <div class="flex justify-between items-center w-full">
          <span>Briefly describe your goals or requirements. ({{ wordCount }}/{{ MAX_WORD }} words)</span>
        </div>
      </template>
      <UTextarea
        v-model="data.helpWith"
        class="w-full"
      />
    </UFormField>

    <div class="sticky bottom-0">
      <UButton
        type="submit"
        label="Submit"
        color="neutral"
        block
        :loading="pending"
      />
    </div>
  </UForm>
</template>
