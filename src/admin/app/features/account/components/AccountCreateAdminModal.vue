<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useClipboard } from '@vueuse/core'
import { PasswordSuggestion } from '@/features/auth'
import { createAdminSchema } from '../schemas/create-admin-form'
import type { ICreateAdminSchema } from '../schemas/create-admin-form'
import { generatePassword } from '../utils/generate-password'

// Create a company and its first admin, then hand over the sign-in details, in one dialog.
// UI only: nothing is sent yet (open question), so submitting shows a preview of the success step
// built from the form. Wiring it moves the submit into a composable with useApiMutation and fills
// the success step from the API's response (docs/crud-recipe.md).
const open = defineModel<boolean>('open', { default: false })

const FORM_ID = 'create-company-admin'
const FIELD = {
  companyName: 'companyName',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  tempPassword: 'tempPassword',
} satisfies { [K in keyof ICreateAdminSchema]: K }

const blankForm = (): ICreateAdminSchema => ({ companyName: '', firstName: '', lastName: '', email: '', tempPassword: '' })
const state = reactive(blankForm())
const created = shallowRef<ICreateAdminSchema>()
const showPassword = shallowRef(false)

// `legacy` falls back to execCommand when the Clipboard API is missing or refused.
const { copy, copied, text } = useClipboard({ legacy: true, copiedDuring: 2000 })

const credentials = computed(() => created.value
  ? `Company: ${created.value.companyName}\nLogin email: ${created.value.email}\nTemporary password: ${created.value.tempPassword}`
  : '')

function isCopied(value: string) {
  return copied.value && text.value === value
}

function onGenerate() {
  state.tempPassword = generatePassword()
  showPassword.value = true
}

function onSubmit(event: FormSubmitEvent<ICreateAdminSchema>) {
  created.value = { ...event.data }
  showPassword.value = false
}

// Every opening starts on a blank form, with the password hidden.
watch(open, (isOpen) => {
  if (!isOpen) return
  Object.assign(state, blankForm())
  created.value = undefined
  showPassword.value = false
})
</script>

<template>
  <UModal
    v-model:open="open"
    :description="created
      ? `${created.firstName} ${created.lastName} is the company admin for ${created.companyName}. Send these sign-in details through a secure channel.`
      : 'Create a company workspace and its first admin.'"
    :ui="{ footer: 'justify-end' }"
  >
    <template #title>
      <span class="flex items-center gap-2">
        <UIcon
          v-if="created"
          name="lucide:circle-check"
          class="size-5 shrink-0 text-success"
        />
        {{ created ? 'Company admin created' : 'Create company admin' }}
        <UBadge
          :label="created ? 'Preview' : 'Not connected'"
          color="neutral"
          variant="subtle"
          size="sm"
        />
      </span>
    </template>

    <template #body>
      <UForm
        v-if="!created"
        :id="FORM_ID"
        :schema="createAdminSchema"
        :state
        :validate-on="[]"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField
          label="Company name"
          :name="FIELD.companyName"
        >
          <UInput
            v-model="state.companyName"
            autocomplete="organization"
            class="w-full"
          />
        </UFormField>

        <div class="grid gap-5 sm:grid-cols-2">
          <UFormField
            label="First name"
            :name="FIELD.firstName"
          >
            <UInput
              v-model="state.firstName"
              autocomplete="off"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Last name"
            :name="FIELD.lastName"
          >
            <UInput
              v-model="state.lastName"
              autocomplete="off"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="Work email"
          :name="FIELD.email"
          help="They sign in to the Portal with this email."
        >
          <UInput
            v-model="state.email"
            type="email"
            autocomplete="off"
            placeholder="name@company.com"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Role">
          <UInput
            model-value="Company Admin"
            disabled
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Temporary password"
          :name="FIELD.tempPassword"
        >
          <UInput
            v-model="state.tempPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            class="w-full"
            :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="showPassword ? 'lucide:eye-off' : 'lucide:eye'"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              />
              <UTooltip text="Generate a strong password">
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  icon="lucide:wand-sparkles"
                  aria-label="Generate a strong password"
                  @click="onGenerate"
                />
              </UTooltip>
            </template>
          </UInput>
        </UFormField>

        <PasswordSuggestion :value="state.tempPassword" />
      </UForm>

      <div
        v-else
        class="space-y-5"
      >
        <UFormField label="Login email">
          <UInput
            :model-value="created.email"
            readonly
            class="w-full"
            :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                :color="isCopied(created.email) ? 'success' : 'neutral'"
                variant="link"
                size="sm"
                :icon="isCopied(created.email) ? 'lucide:copy-check' : 'lucide:copy'"
                :aria-label="isCopied(created.email) ? 'Login email copied' : 'Copy login email'"
                @click="copy(created.email)"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Temporary password">
          <UInput
            :model-value="created.tempPassword"
            :type="showPassword ? 'text' : 'password'"
            readonly
            class="w-full"
            :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="showPassword ? 'lucide:eye-off' : 'lucide:eye'"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              />
              <UButton
                :color="isCopied(created.tempPassword) ? 'success' : 'neutral'"
                variant="link"
                size="sm"
                :icon="isCopied(created.tempPassword) ? 'lucide:copy-check' : 'lucide:copy'"
                :aria-label="isCopied(created.tempPassword) ? 'Temporary password copied' : 'Copy temporary password'"
                @click="copy(created.tempPassword)"
              />
            </template>
          </UInput>
        </UFormField>

        <UAlert
          icon="lucide:info"
          color="neutral"
          variant="subtle"
          description="Preview only: the create endpoint isn't connected yet, so no account was made."
        />
      </div>
    </template>

    <template #footer>
      <template v-if="!created">
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          @click="open = false"
        />
        <UButton
          type="submit"
          :form="FORM_ID"
          label="Create admin"
          icon="lucide:user-plus"
        />
      </template>
      <template v-else>
        <UButton
          label="Done"
          color="neutral"
          variant="outline"
          @click="open = false"
        />
        <UButton
          :label="isCopied(credentials) ? 'Copied' : 'Copy credentials'"
          :icon="isCopied(credentials) ? 'lucide:copy-check' : 'lucide:copy'"
          @click="copy(credentials)"
        />
      </template>
    </template>
  </UModal>
</template>
