<script setup lang="ts">
// Static UI: the two dialogs have no submit wiring yet (open question). Rendered in
// AccountListScreen's `#actions` slot, which it draws twice (navbar from `sm`, a row below it
// on a phone), so each copy keeps its own dialog state.
import AccountCreateAdminModal from './AccountCreateAdminModal.vue'

interface OpenItem {
  create: boolean
  createAdmin: boolean
}

const open = reactive<OpenItem>({
  create: false,
  createAdmin: false,
})

// Local only until the create endpoint exists: no schema, no submit.
type MemberRole = 'Admin' | 'Operator'

const roleItems = [
  { label: 'Admin', value: 'Admin', icon: 'lucide:shield-check' },
  { label: 'Operator', value: 'Operator', icon: 'lucide:user-round' },
] satisfies { label: string, value: MemberRole, icon: string }[]

const blankForm = () => ({
  companyName: '',
  firstName: '',
  lastName: '',
  email: '',
  role: undefined as MemberRole | undefined,
})
const form = reactive(blankForm())

// Each opening starts with an empty form.
watch(() => open.create, (isOpen) => {
  if (isOpen) Object.assign(form, blankForm())
})
</script>

<template>
  <!-- Several roots, so the buttons are the slot's own children in the navbar and the phone grid. -->
  <UButton
    label="Add member"
    variant="outline"
    color="neutral"
    @click="open.create = true"
  />
  <UButton
    label="Create Admin"
    @click="open.createAdmin = true"
  />

  <UModal
    v-model:open="open.create"
    title="Add member"
    description="Add a person to a company workspace and choose their role"
  >
    <template #body>
      <UForm
        :state="form"
        :validate-on="[]"
        class="space-y-6"
      >
        <fieldset class="space-y-4">
          <legend class="mb-3 flex items-center gap-2 text-sm font-semibold text-highlighted">
            <UIcon
              name="lucide:building-2"
              class="size-4 text-muted"
            />
            Company
          </legend>
          <UFormField
            label="Company name"
            name="companyName"
            required
          >
            <UInput
              v-model="form.companyName"
              class="w-full"
              placeholder="e.g. Northwind Apparel"
              autocomplete="off"
            />
          </UFormField>
        </fieldset>

        <USeparator />

        <fieldset class="space-y-4">
          <legend class="mb-3 flex items-center gap-2 text-sm font-semibold text-highlighted">
            <UIcon
              name="lucide:user-round"
              class="size-4 text-muted"
            />
            Member
          </legend>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField
              label="First name"
              name="firstName"
              required
            >
              <UInput
                v-model="form.firstName"
                class="w-full"
                autocomplete="off"
              />
            </UFormField>
            <UFormField
              label="Last name"
              name="lastName"
              required
            >
              <UInput
                v-model="form.lastName"
                class="w-full"
                autocomplete="off"
              />
            </UFormField>
          </div>

          <UFormField
            label="Work email"
            name="email"
            help="They sign in with this email."
            required
          >
            <UInput
              v-model="form.email"
              type="email"
              icon="lucide:mail"
              class="w-full"
              placeholder="name@company.com"
              autocomplete="off"
            />
          </UFormField>

          <UFormField
            label="Role"
            name="role"
            required
          >
            <USelect
              v-model="form.role"
              :items="roleItems"
              :icon="roleItems.find(item => item.value === form.role)?.icon"
              class="w-full"
              placeholder="Select a role"
            />
          </UFormField>
        </fieldset>

        <UAlert
          icon="lucide:info"
          color="neutral"
          variant="subtle"
          description="Adding members isn't connected to the API yet, so Add member is off."
        />

        <footer class="-mx-4 -mb-4 flex flex-col-reverse gap-2 border-t border-default px-4 py-4 sm:-mx-6 sm:-mb-6 sm:flex-row sm:justify-end sm:px-6">
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            class="justify-center"
            @click="open.create = false"
          />
          <UButton
            type="submit"
            label="Add member"
            icon="lucide:user-plus"
            class="justify-center"
            disabled
          />
        </footer>
      </UForm>
    </template>
  </UModal>

  <AccountCreateAdminModal v-model:open="open.createAdmin" />
</template>
