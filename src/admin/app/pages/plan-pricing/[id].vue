<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        icon="lucide:tags"
        title="Plan Detail"
      >
        <template #leading>
          <UButton
            icon="lucide:arrow-left"
            color="neutral"
            variant="ghost"
            to="/plan-pricing"
            aria-label="Back to plans"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UEmpty
        icon="lucide:construction"
        title="Not available yet"
        description="This page is a placeholder until plan details are wired to the API."
      />
    </template>
  </UDashboardPanel>
</template>
