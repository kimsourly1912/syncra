<script setup lang="ts">
import type { ListDetail } from '@/components/list/ListDetails.vue'

const route = useRoute()
const id = route.params.id as string

const leadItems: ListDetail[] = [
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

const contactInfoItems: ListDetail[] = [
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
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        icon="lucide:inbox"
        :title="`Lead Inquiry #L-${id} Detail`"
      >
        <template #leading>
          <UButton
            icon="lucide:arrow-left"
            color="neutral"
            variant="ghost"
            to="/lead-inquiry"
            aria-label="Back to lead inquiries"
          />
        </template>
        <template #right>
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
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert
        icon="lucide:circle-check"
        title="This Lead has been marked as converted to Customer by Admin A"
        variant="soft"
        size="xl"
        color="success"
      />

      <UPageCard
        title="Lead Information"
        variant="outline"
      >
        <ListDetails :items="leadItems" />
      </UPageCard>

      <UPageCard
        title="Contact Information"
        variant="outline"
      >
        <ListDetails :items="contactInfoItems" />
      </UPageCard>

      <UPageCard
        title="Interested Product"
        variant="outline"
      >
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
      </UPageCard>

      <UPageCard
        title="Lead Intent"
        variant="outline"
      >
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
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>
