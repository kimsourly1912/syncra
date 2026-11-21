<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import type { FooterColumn, NavigationMenuItem, ButtonProps, SelectItem } from '@nuxt/ui'

const { toPortal } = useURL()
const route = useRoute()
const headerItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Products',
    to: '/products',
    active: route.path.startsWith('/products'),
  },
  {
    label: 'Community',
    to: '/community',
    active: route.path.startsWith('/community'),
  },
  {
    label: 'Download',
    to: '/download',
    active: route.path.startsWith('/download'),
  },
])

const footerItems: FooterColumn[] = [
  {
    label: 'Get to know us',
    children: [
      {
        label: 'About Syncra',
        to: '/about',
        target: '',
      },
      {
        label: 'News Center',
        to: '/news-center',
        target: '',
      },
      // {
      //   label: 'Privacy Policy',
      //   to: '/privacy-policy',
      //   target: '',
      // },
      // {
      //   label: 'Terms of Use',
      //   to: '/terms-of-use',
      //   target: '',
      // },
    ],
  },
]
const socialMedia: { icon: string; to: string }[] = [
  {
    icon: 'logo:youtube',
    to: 'https://www.youtube.com/@syncra-channel',
  },
  {
    icon: 'logo:linkedin',
    to: 'https://www.linkedin.com/company/syncra-docai',
  },
  {
    icon: 'logo:facebook',
    to: 'https://www.facebook.com/profile.php?id=61585570862720',
  },
]
</script>

<template>
  <UApp
    :toaster="{
      position: 'top-right',
    }"
  >
    <UHeader mode="slideover">
      <template #title>
        <NuxtLink
          to="/"
          class="font-semibold flex items-center gap-2"
        >
          <img
            class="w-8"
            src="/img/syncra-logo.png"
          >
          Syncra
        </NuxtLink>
      </template>
      <UNavigationMenu :items="headerItems" />
      <template #right>
        <!-- <UColorModeButton class="lg:inline-flex hidden" /> -->
        <SelectLanguage class="lg:inline-flex hidden max-w-36" />
        <UButton
          label="Sign In"
          target="_blank"
          :to="toPortal('/auth/sign-in')"
        />
      </template>
      <template #body>
        <UNavigationMenu
          :items="headerItems"
          orientation="vertical"
        />
        <section class="lg:hidden flex flex-col mt-6 gap-4">
          <!-- <UColorModeSelect class="w-full" /> -->
          <SelectLanguage />
        </section>
      </template>
    </UHeader>
    <slot />
    <!-- <UMain class="relative">
      <UContainer class="pt-10 lg:pt-20 pb-20">
        <slot />
        <div
          class="size-2/4 bg-conic  fixed rounded-full -z-10 opacity-20 blur-[200px] bg-teal-500 dark:bg-teal-400 top-0 left-0"
        />
        <div class="size-2/4 fixed rounded-full -z-10 opacity-20 blur-[200px] bg-primary bottom-0 right-0" />
      </UContainer>
    </UMain> -->
    <USeparator
      type="dashed"
      class="h-px"
    />

    <UFooter
      :ui="{
        root: 'bg-elevated/50',
        top: 'border-b border-default',
      }"
    >
      <template #top>
        <UContainer>
          <UFooterColumns
            :columns="footerItems"
            :ui="{
              label: 'text-xl font-semibold',
              link: 'text-sm text-muted hover:text-primary',
            }"
          >
            <template #left>
              <section class="inline-flex flex-col items-center gap-2">
                <img
                  class="w-14"
                  src="/img/syncra-logo.png"
                >
                <h1 class="font-semibold text-3xl">
                  Syncra
                </h1>
              </section>

              <ul class="mt-6 flex gap-2 flex-wrap">
                <li
                  v-for="(o, idx) in socialMedia"
                  :key="idx"
                >
                  <UButton
                    variant="subtle"
                    color="neutral"
                    :icon="o.icon"
                    :to="o.to"
                    target="_blank"
                  />
                </li>
              </ul>
            </template>
          </UFooterColumns>
        </UContainer>
      </template>

      <template #right>
        <p class="text-muted text-sm">
          © {{ new Date().getFullYear() }} Syncra. All rights reserved.
        </p>
      </template>
    </UFooter>
  </UApp>
</template>
