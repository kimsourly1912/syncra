<script lang="ts">
import type { SelectMenuItem } from '@nuxt/ui'
import type { GetItemValue } from '@nuxt/ui/runtime/types/utils.js'

export type InputPhoneNumberOption = {
  value: string
} | SelectMenuItem
</script>

<script lang="ts" setup generic="T extends InputPhoneNumberOption">
withDefaults(defineProps<{
  label?: string
  options: T[]
  required?: boolean
  placeholder?: {
    phone: string
    phoneCode: string
  }
  name: {
    phone: string
    phoneCode: string
  }
}>(), {

})

const phone = defineModel<string>('phone', { default: '' })
const phoneCode = defineModel<GetItemValue<T, undefined>>('phoneCode')
</script>

<template>
  <UFormField
    class="flex flex-col"
    :label
    :required
    :ui="{ container: 'flex gap-2.5' }"
  >
    <UFormField
      class="text-left"
      :name="name.phoneCode"
    >
      <USelectMenu
        v-model="phoneCode"
        class="w-24"
        :items="options"
        label-key="label"
        :placeholder="placeholder?.phoneCode"
      >
        <template #empty>
          No Data
        </template>
      </USelectMenu>
    </UFormField>

    <UFormField
      class="text-left flex-1"
      :name="name.phone"
    >
      <UInput
        v-model="phone"
        v-keyfilter
        inputmode="numeric"
        class="w-full"
        :placeholder="placeholder?.phone"
      />
    </UFormField>
  </UFormField>
</template>
