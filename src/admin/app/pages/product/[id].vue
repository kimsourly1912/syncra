<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        icon="lucide:package"
        title="Product Detail"
      >
        <template #leading>
          <UButton
            icon="lucide:arrow-left"
            color="neutral"
            variant="ghost"
            to="/product"
            aria-label="Back to products"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UEmpty
        icon="lucide:construction"
        title="Not available yet"
        description="This page is a placeholder until product details are wired to the API."
      />
    </template>
  </UDashboardPanel>
</template>
