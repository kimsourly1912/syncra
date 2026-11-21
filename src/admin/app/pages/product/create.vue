<script setup lang="ts">
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Create New Product">
        <template #leading>
          <UButton
            icon="lucide:arrow-left"
            color="neutral"
            variant="ghost"
            to="/product"
            aria-label="Back"
          />
        </template>
        <template #right>
          <UButton
            label="Cancel"
            variant="outline"
            color="error"
          />
          <UButton
            label="Save"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageCard
        title="Product Listing Information"
        variant="outline"
      >
        <UForm class="space-y-5">
          <UFormField
            label="Product Icon"
            name="icon"
          >
            <div class="flex items-center gap-4">
              <div class="size-16 min-w-16 flex items-center justify-center ring ring-default rounded-lg">
                <UIcon
                  name="lucide:image"
                  class="text-2xl text-muted"
                />
              </div>
              <UButton
                icon="lucide:upload"
                label="Upload Icon"
                variant="outline"
                color="neutral"
              />
              <UButton
                label="Remove"
                color="error"
                variant="outline"
              />
            </div>
            <p class="text-muted text-sm mt-2">
              PNG or SVG · Max 1MB · Recommended 64×64 px
            </p>
          </UFormField>

          <UFormField
            label="Product Name"
            name="name"
          >
            <UInput class="w-full" />
          </UFormField>

          <UFormField
            label="Product Description"
            name="description"
          >
            <UTextarea class="w-full" />
          </UFormField>

          <UFormField
            label="Show on Product Page"
            name="showPage"
          >
            <div class="flex items-center justify-between gap-4">
              <p class="text-highlighted text-base">
                When enable, user see this Product in Product Listing Page
              </p>
              <USwitch />
            </div>
          </UFormField>
        </UForm>
      </UPageCard>

      <UPageCard
        title="Product Detail Page"
        variant="outline"
      >
        <UForm>
          <UFormField
            label="Coming Soon"
            name="soon"
          >
            <div class="flex items-center justify-between gap-4">
              <p class="text-highlighted text-base">
                When enabled, user see the Coming soon page instead of the detail Page
              </p>
              <USwitch />
            </div>
          </UFormField>
        </UForm>
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>
