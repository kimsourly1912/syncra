<script setup lang="ts">
import type { IContactSaleSchema } from '~/schema/contact-sale.schema'
import { MAX_WORD, contactSaleSchema } from '~/schema/contact-sale.schema'
import type { ModuleDTO } from '@/types/dto'
import type { ObjectValueToString } from '~/types/common'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import * as v from 'valibot'

const props = defineProps<{
  loading?: boolean
  moduleItems: ModuleDTO.ModuleData[]
  disabledInterestedProduct?: boolean
  fieldName: ObjectValueToString<IContactSaleSchema>
}>()

defineEmits<{
  submit: [evt: FormSubmitEvent<IContactSaleSchema>]
}>()

const data = defineModel<IContactSaleSchema>('data', { required: true })
const wordCount = computed(() => v._getWordCount('en', data.value.helpWith || ''))

const productTypes = computed(() => props.moduleItems.map<SelectMenuItem>(o => ({
  label: o.name,
  value: `${o.id}`,
})))
</script>

<template>
  <UForm
    :state="data"
    :schema="contactSaleSchema"
    class="flex flex-col gap-5"
    :validate-on="[]"
    @submit="(data) => $emit('submit', data)"
  >
    <UFormField
      label="Interested product from syncra"
      :name="fieldName.interestedProduct"
      required
    >
      <USelectMenu
        v-model="data.interestedProduct"
        class="w-full"
        :items="productTypes"
        value-key="value"
        multiple
        :disabled="disabledInterestedProduct"
      >
        <template #empty>
          No Data
        </template>
      </USelectMenu>
    </UFormField>

    <UFormField
      label="What can we help with?"
      :description="`Briefly describe your goals or requirements. (${wordCount}/${MAX_WORD} words)`"
      :name="fieldName.helpWith"
    >
      <UTextarea
        v-model="data.helpWith"
        class="w-full"
      />
    </UFormField>

    <UButton
      type="submit"
      label="Submit"
      color="neutral"
      block
      :loading
    />
  </UForm>
</template>
