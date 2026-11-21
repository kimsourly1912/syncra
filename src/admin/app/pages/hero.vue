<template>
  <UDashboardPanel class="page-narrow">
    <template #header>
      <UDashboardNavbar title="HeroPage Management">
        <template #right>
          <UButton label="Edit" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageCard
        title="Hero Content"
        variant="outline"
      >
        <dl class="space-y-4">
          <div>
            <dt class="text-muted text-sm">
              Tagline
            </dt>
            <dd class="mt-1">
              Enterprise AI Solutions for Modern Supply Chains
            </dd>
          </div>

          <div>
            <dt class="text-muted text-sm">
              Description
            </dt>
            <dd class="mt-1">
              Syncra helps manufacturers automate complex workflows with intelligent AI modules designed for tech packs,
              quality control, and document extraction.
            </dd>
          </div>

          <div>
            <dt class="text-muted text-sm">
              Hero Video
            </dt>
            <dd class="mt-1">
              <UEmpty
                icon="lucide:video"
                title="No Video Uploaded"
                description="Click Edit to upload a hero video"
                variant="subtle"
              />
            </dd>
          </div>
        </dl>
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>
