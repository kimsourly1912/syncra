<script setup lang="ts">
import { AccountListScreen } from '@/features/account'

// The two dialogs below are static UI with no submit wiring yet (open question).
interface OpenItem {
  create: boolean
  success: boolean
}

const open = reactive<OpenItem>({
  create: false,
  success: false,
})
</script>

<template>
  <div class="contents">
    <!-- One root: `contents` adds no box, so the panel stays the layout's child. -->
    <AccountListScreen>
      <template #actions>
        <UButton
          label="Add Member"
          variant="outline"
          color="neutral"
          @click="open.create = true"
        />
        <UButton
          label="Create Admin"
          @click="open.success = true"
        />
      </template>
    </AccountListScreen>

    <UModal
      v-model:open="open.create"
      title="Create Company Admin"
      description="Create a workspace and its primary admin"
    >
      <template #body>
        <UForm
          :validate-on="[]"
          class="space-y-5"
        >
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
            <UBadge
              icon="lucide:circle-check"
              size="xl"
              square
              class="rounded-full p-3"
            />
            <section class="space-y-1">
              <h1 class="text-2xl text-highlighted font-medium">
                Company Admin Created
              </h1>
              <p class="text-muted">
                Sarah Chan Has been registered as the company admin for Syncra Inc.
              </p>
            </section>
          </header>

          <UForm
            :validate-on="[]"
            class="space-y-6"
          >
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
