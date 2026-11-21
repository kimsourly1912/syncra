<script setup lang="ts">
</script>

<template>
  <div>
    <LayoutContent>
      <LayoutHeading
        title="Create New Plan"
        to="/plan-pricing"
      >
        <template #suffix>
          <UButton
            label="Cancel"
            variant="outline"
            color="error"
          />
          <UButton
            label="Save"
          />
        </template>
      </LayoutHeading>

      <CardWrapper title="Plan Information">
        <UForm class="space-y-5">
          <UFormField
            label="Plan Name"
            name="name"
          >
            <UInput class="w-full" />
          </UFormField>

          <UFormField
            label="Plan Description"
            name="description"
          >
            <UTextarea class="w-full" />
          </UFormField>

          <UFormField
            label="Show on Plan & Pricing Page"
            name="showPage"
          >
            <div class="flex items-center justify-between gap-4">
              <p class="text-highlighted text-base">
                When Enable, user see this Plan in Plan & Pricing Page
              </p>
              <USwitch />
            </div>
          </UFormField>
        </UForm>
      </CardWrapper>

      <CardWrapper title="Pricing Configuration">
        <UForm class="space-y-5">
          <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <UFormField
              label="Currency"
              name="currency"
            >
              <USelect
                :items="['USD $', 'RIEL ៛']"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Price Amount"
              name="amount"
            >
              <UInput class="w-full" />
            </UFormField>
            <UFormField
              label="Billing Type"
              name="billing"
            >
              <USelect
                :items="['Recurring', 'Monthly']"
                class="w-full"
              />
            </UFormField>
          </section>

          <section class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField
              label="Price Prefix"
              name="prefix"
            >
              <UInput class="w-full" />
            </UFormField>
            <UFormField
              label="Billing Cycle"
              name="billing-cycle"
            >
              <USelect
                :items="['Per Year', 'Per Month']"
                class="w-full"
              />
            </UFormField>
          </section>
        </UForm>
      </CardWrapper>

      <CardWrapper title="Key Features">
        <UForm class="space-y-5">
          <UForm
            class="space-y-3"
            nested
          >
            <UFormField
              v-for="i in 3"
              :key="i"
            >
              <section

                class="flex items-center gap-2"
              >
                <UInput
                  class="flex-1"
                  placeholder="e.g Automate Document Processing"
                />
                <UButton
                  variant="ghost"
                  color="error"
                  icon="lucide:trash-2"
                />
              </section>
            </UFormField>
          </UForm>

          <UButton
            label="Add Feature"
            icon="lucide:plus"
            variant="ghost"
          />
        </UForm>
      </CardWrapper>
    </LayoutContent>
  </div>
</template>
