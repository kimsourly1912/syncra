<script setup lang="ts">
useHead({ title: 'Community Management' })

// Placeholder: Community Management has no requirement and no API yet (open question). The page
// says so and lists what's needed, so it isn't mistaken for a broken or empty screen.
const NEEDED = [
  {
    icon: 'lucide:list-checks',
    title: 'What it covers',
    description: 'Who the community is and what staff do here, decided by the product owner.',
  },
  {
    icon: 'lucide:plug',
    title: 'An API to read and manage it',
    description: 'The Admin API has no community endpoints yet.',
  },
  {
    icon: 'lucide:shield-check',
    title: 'Who may use it',
    description: 'Which staff can see and change community content, enforced by the API.',
  },
]
</script>

<template>
  <UDashboardPanel class="page-narrow">
    <template #header>
      <UDashboardNavbar
        icon="lucide:users"
        title="Community Management"
      >
        <template #right>
          <UBadge
            label="Not defined yet"
            color="neutral"
            variant="subtle"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto w-full max-w-xl space-y-6 py-6 text-center sm:py-12">
        <span class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UIcon
            name="lucide:users"
            class="size-7"
          />
        </span>
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-highlighted">
            Community Management is coming
          </h2>
          <p class="text-pretty text-muted">
            This section has a place in Admin, but what it does hasn't been decided yet. It'll be built once these are in place.
          </p>
        </div>

        <ol class="space-y-3 text-start">
          <li
            v-for="(item, index) in NEEDED"
            :key="item.title"
            class="flex gap-3 rounded-lg border border-default bg-elevated/40 p-4"
          >
            <span class="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <UIcon
                :name="item.icon"
                class="size-4 text-muted"
                aria-hidden="true"
              />
            </span>
            <div class="min-w-0">
              <p class="font-medium text-highlighted">
                <span class="sr-only">Step {{ index + 1 }}: </span>{{ item.title }}
              </p>
              <p class="text-sm text-muted">
                {{ item.description }}
              </p>
            </div>
          </li>
        </ol>
      </div>
    </template>
  </UDashboardPanel>
</template>
