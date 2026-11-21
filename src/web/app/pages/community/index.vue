<script lang="ts" setup>
import type { ButtonProps } from '@nuxt/ui'

interface Item {
  title: string
  link: string
  icon: string
  description: string
  color: ButtonProps['color']
  btnLabel: string
}

const items: Item[] = [
  {
    title: 'Events',
    description: 'Join workshops, webinars, and gatherings that connect innovators across the Syncra ecosystem. Network with peers, learn best practices, and stay ahead of industry trends.',
    icon: 'lucide:calendar',
    link: '/community/events',
    color: 'primary',
    btnLabel: 'Explore Events',
  },
  {
    title: 'Customer Stories',
    description: 'Hear how industry leaders transform operations with Syncra\'s digital solutions. Discover real-world success stories, implementation insights, and measurable results.',
    icon: 'lucide:star',
    link: '/community/customer-stories',
    color: 'warning',
    btnLabel: 'View Stories',
  },
]

useHead({
  titleTemplate: 'Community - %s',
})
</script>

<template>
  <LayoutDefault>
    <div>
      <main>
        <h1 class="text-4xl font-semibold text-center text-highlighted">
          Join the Syncra Community
        </h1>
        <p class="lg:text-lg text-muted mt-10 mb-8 text-center">
          Discover how industry leaders, partners, and users connect through Syncra's ecosystem
        </p>

        <ul class="mt-14 grid md:grid-cols-2 gap-10">
          <li
            v-for="(o, idx) in items"
            :key="idx"
            class=" flex flex-col space-y-5 p-5 bg-muted transition-all ring ring-accented rounded-lg"
          >
            <div>
              <div class="space-y-2.5">
                <UButton
                  :icon="o.icon"
                  size="xl"
                  class="inline-flex"
                  variant="soft"
                  :color="o.color"
                />
                <h1 class="text-highlighted text-xl font-semibold ">
                  {{ o.title }}
                </h1>
              </div>
              <p class="text-sm text-muted">
                {{ o.description }}
              </p>
            </div>
            <div class="mt-auto">
              <UButton
                :label="o.btnLabel"
                trailing-icon="lucide:arrow-right"
                :to="o.link"
                size="xl"
                :color="o.color"
              />
            </div>
          </li>
        </ul>
      </main>
    </div>
  </LayoutDefault>
</template>
