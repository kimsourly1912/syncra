<script setup lang="ts">
import * as v from 'valibot'
import type { FormSubmitEvent, SelectItem } from '@nuxt/ui'
import type { SchemaToString } from '@/types/common'
import { contactSaleForTokenSchema, MAX_WORD } from '@/schema/contact-sale-token'
import type { IContactSaleForTokenSchema } from '@/schema/contact-sale-token'

const FIELD_NAME = {
  amount: 'amount',
  message: 'message',
} satisfies SchemaToString<IContactSaleForTokenSchema>

const data = defineModel<IContactSaleForTokenSchema>('data', { required: true })
const wordCount = computed(() => v._getWordCount('en', data.value.message || ''))

const tokens = [1600000, 3200000, 4800000, 6400000]
const formatter = new Intl.NumberFormat('en-US')

const tokenItems = Array.from({ length: tokens.length }, (_, idx) => {
  const token = tokens[idx]!
  return {
    value: String(token),
    label: `${formatter.format(token)} Tokens`,
  } satisfies SelectItem
})

defineProps<{
  pending?: boolean
}>()

defineEmits<{
  submit: [evt: FormSubmitEvent<IContactSaleForTokenSchema>]
}>()
</script>

<template>
  <UForm
    :state="data"
    :schema="contactSaleForTokenSchema"
    class="flex flex-col gap-5"
    :validate-on="[]"
    @submit="(evt) => $emit('submit', evt)"
  >
    <UFormField
      :name="FIELD_NAME.amount"
      label="Request token amount"
      required
    >
      <USelect
        v-model="data.amount"
        :items="tokenItems"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Additional detail"
      :name="FIELD_NAME.message"
      :description="`Optional message. (${wordCount}/${MAX_WORD} words)`"
    >
      <UTextarea
        v-model="data.message"
        class="w-full"
      />
    </UFormField>

    <UButton
      block
      type="submit"
      label="Submit"
      color="neutral"
      :loading="pending"
    />
  </UForm>
</template>
