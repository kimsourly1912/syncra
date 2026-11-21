<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { UBadge, UButton } from '#components'
import type { CardBoxItem } from '@/types/components/card'
import { tableTheme } from '@/theme/table'

interface OpenItem {
  create: boolean
  success: boolean
}

const open = reactive<OpenItem>({
  create: false,
  success: false,
})

const overviewItems: CardBoxItem[] = [
  {
    label: 'Account Registered',
    icon: 'lucide:building-2',
    value: '100',
    color: 'primary',
  },
  {
    label: 'Completed Onboarding Verification',
    icon: 'lucide:circle-check',
    value: '20',
    color: 'primary',
  },
  {
    label: 'Pending Onboarding Verification',
    icon: 'lucide:clock',
    value: '45',
    color: 'primary',
  },
]

interface Data {
  id: string
  name: string
  email: string
  status: string
  moduleActive: string
  token: string
  seat: string
  companyName: string
}

const data = Array.from({ length: 5 }, (_, idx) => ({
  id: `${idx}`,
  name: 'John Doe',
  email: 'Suci@gmail.com',
  status: idx % 2 === 0 ? 'Pending' : 'Completed',
  moduleActive: `${idx}`,
  token: '50',
  seat: '10/20',
  companyName: 'Syncra',
})) satisfies Data[]

const columns = computed(() => {
  return [
    {
      accessorKey: 'User ID',
      header: 'User ID',
      cell({ row }) {
        return `User-${row.original.id}`
      },
    },
    {
      accessorKey: 'email',
      header: 'Email Address',
    },
    {
      accessorKey: 'name',
      header: 'User Name',
    },
    {
      accessorKey: 'companyName',
      header: 'Company Name',
    },
    {
      accessorKey: 'status',
      header: 'Onboarding Status',
      cell({ row }) {
        const { status } = row.original
        return h(UBadge, { label: status, color: 'success', size: 'lg', variant: 'soft' })
      },
    },
    {
      accessorKey: 'moduleActive',
      header: 'Module Active',
    },
    {
      accessorKey: 'token',
      header: 'Token',
    },
    {
      accessorKey: 'seat',
      header: 'Seat',
    },
    {
      id: 'action',
      header: 'Action',
      cell({ row }) {
        const { id } = row.original
        return h(UButton, { label: 'Manage', to: `/account/${id}` })
      },
    },
  ] satisfies TableColumn<Data>[]
})
</script>

<template>
  <div>
    <LayoutContent>
      <LayoutHeading
        title="Account Management"
        description="Manage company information, workspace, token, seat"
      >
        <template #suffix>
          <UButton
            label="Add Member to Company"
            variant="outline"
            color="info"
            @click="open.create = true"
          />
          <UButton
            label="Create Company Admin"
            @click="open.success = true"
          />
        </template>
      </LayoutHeading>

      <CardBoxWrapper :cols="3">
        <CardBoxItem :items="overviewItems" />
      </CardBoxWrapper>

      <section class="space-y-4">
        <section class="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <UInput
            icon="lucide:search"
            placeholder="Search"
            class="lg:col-span-9 sm:col-span-6"
          />

          <USelect
            placeholder="Onboarding Status"
            :items="['Completed', 'Pending']"
            class="lg:col-span-3 sm:col-span-6"
          />
        </section>

        <UTable
          :data
          :columns
          :ui="tableTheme"
        />
      </section>
    </LayoutContent>

    <UModal
      v-model:open="open.create"
      title="Create Company Admin"
      description="Create a workspace and its primary admin"
    >
      <template #body>
        <UForm class="space-y-5">
          <UFormField
            label="Company Name"
          >
            <UInput
              class="w-full"
              placeholder="Input Company Name"
            />
          </UFormField>

          <section class="grid sm:grid-cols-2 grid-cols-1 gap-5">
            <UFormField
              label="First Name"
            >
              <UInput
                class="w-full"
                placeholder="Input First Name"
              />
            </UFormField>
            <UFormField
              label="Last Name"
            >
              <UInput
                class="w-full"
                placeholder="Input Last Name"
              />
            </UFormField>
          </section>

          <UFormField
            label="Email Address"
          >
            <UInput
              class="w-full"
              placeholder="Input Email Address"
            />
          </UFormField>

          <UFormField
            label="Role"
          >
            <UInput
              class="w-full"
              placeholder="Admin"
              disabled
              :ui="{
                base: 'disabled:bg-elevated',
              }"
            />

            <USelect
              value-key="Operator"
              :items="['Operator', 'Admin']"
              class="w-full"
              placeholder="Select Role"
            />
          </UFormField>

          <footer class="flex gap-5">
            <UButton
              label="Cancel"
              variant="outline"
              color="error"
              block
            />
            <UButton
              label="Create Account"
              block
            />
          </footer>
        </UForm>
      </template>
    </UModal>

    <UModal
      v-model:open="open.success"
    >
      <template #content>
        <section class="p-8 space-y-6">
          <header class="space-y-4 text-center flex items-center justify-center flex-col">
            <div class="size-14 rounded-full flex items-center justify-center bg-primary">
              <UIcon
                name="lucide:circle-check"
                class="text-3xl text-white"
              />
            </div>
            <section class="space-y-1">
              <h1 class="text-2xl text-highlighted font-medium">
                Company Admin Created
              </h1>
              <p class="text-muted">
                Sarah Chan Has been registered as the company admin for Syncra Inc.
              </p>
            </section>
          </header>

          <UForm class="space-y-6">
            <UFormField
              label="Login Email"
            >
              <section class="flex items-center gap-2.5">
                <UInput class="flex-1" />
                <UButton
                  icon="lucide:copy"
                  color="neutral"
                  variant="outline"
                />
              </section>
            </UFormField>

            <UFormField
              label="Temporary Password"
            >
              <section class="flex items-center gap-2.5">
                <InputPassword />
                <UButton
                  icon="lucide:copy"
                  color="neutral"
                  variant="outline"
                />
              </section>
            </UFormField>

            <footer class="flex gap-5">
              <UButton
                label="Copy All"
                icon="lucide:copy"
                color="info"
                variant="outline"
                block
              />

              <UButton
                label="Done"
                block
              />
            </footer>
          </UForm>
        </section>
      </template>
    </UModal>
  </div>
</template>
