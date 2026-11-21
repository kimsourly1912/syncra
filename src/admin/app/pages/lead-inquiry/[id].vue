<script setup lang="ts">
import type { ListItem } from '@/types/components/list'

const route = useRoute()
const id = route.params.id as string

const leadItems: ListItem[] = [
  {
    label: 'Lead ID',
    value: `L-${id}`,
    type: 'text',
  },
  {
    label: 'Submitted Date',
    value: 'Dec 10, 2025',
    type: 'text',
  },
  {
    label: 'Request Status',
    value: 'New',
    type: 'badge',
  },
]

const contactInfoItems: ListItem[] = [
  {
    label: 'Name',
    value: 'John Doe',
    type: 'text',
  },
  {
    label: 'Company',
    value: 'Testing',
    type: 'text',
  },
  {
    label: 'Phone Number',
    value: '+855111222333',
    type: 'text',
  },
  {
    label: 'Email Address',
    value: 'Suci@gmail.com',
    type: 'text',
  },
]
</script>

<template>
  <div>
    <LayoutContent>
      <LayoutHeading
        :title="`Lead Inquiry #L-${id} Detail`"
        to="/lead-inquiry"
      >
        <template #suffix>
          <UButton
            label="Mark as not Interested"
            color="error"
            variant="outline"
          />
          <UButton
            label="Mark as Contacted"
            color="secondary"
            variant="outline"
          />
          <UButton
            label="Converted to Customer"
          />
        </template>
      </LayoutHeading>

      <UAlert
        icon="lucide:circle-check"
        title="This Lead has been marked as converted to Customer by Admin A"
        variant="soft"
        size="xl"
        color="success"
      />

      <CardWrapper title="Lead Information">
        <ListWrapper>
          <ListItem :items="leadItems" />
        </ListWrapper>
      </CardWrapper>

      <CardWrapper title="Contact Information">
        <ListWrapper>
          <ListItem :items="contactInfoItems" />
        </ListWrapper>
      </CardWrapper>

      <CardWrapper title="Interested Product">
        <ul class="flex items-center gap-4 flex-wrap">
          <li
            v-for="i in 3"
            :key="i"
          >
            <UBadge
              label="Doc AI"
            />
          </li>
        </ul>
      </CardWrapper>

      <CardWrapper title="Lead Intent">
        <section class="space-y-2">
          <h1 class="text-muted">
            Customer Message
          </h1>
          <UAlert
            variant="outline"
            color="neutral"
            :ui="{
              description: 'text-base',
            }"
            description="We would like to activate the DocAI module to streamline our document processing workflow. Our team processes over 500 tech packs and invoices monthly, and the AI-powered extraction features would significantly improve our efficiency."
          />
        </section>
      </CardWrapper>
    </LayoutContent>
  </div>
</template>
