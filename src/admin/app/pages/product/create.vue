<script setup lang="ts">
</script>

<template>
  <div>
    <LayoutContent>
      <LayoutHeading
        title="Create New Product"
        to="/product"
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

      <CardWrapper title="Product Listing Information">
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
      </CardWrapper>

      <CardWrapper title="Product Detail Page">
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
      </CardWrapper>
    </LayoutContent>
  </div>
</template>
