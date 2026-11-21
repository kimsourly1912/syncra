<script lang="ts" setup>
const { moduleExecute, moduleData } = useModule()

moduleExecute()
const { data, open, submit, pending, clearAll } = useContactSale()

const onSubmit = submit()

watch(() => open.contactSale, (isOpen) => {
  if (isOpen) clearAll()
})

type Plan = {
  id: string
  title: string
  desc: string
  price: string
  priceNote?: string
  billing?: string
  features: string[]
  highlight?: boolean
}

const plans: Plan[] = [
  {
    id: 'subscription',
    title: 'Subscription Module',
    desc: 'Perfect for small teams ready to unlock Syncra’s core synchronization and AI automation capabilities.',
    price: '$99',
    billing: '/month',
    features: [
      '5 free user accounts (additional user $25/user/month)',
      'Full access to standard AI module (WIP, score card & basic alert features)',
      'Email & chat support (48-hour response)',
      'Cancel anytime',
    ],
  },
  {
    id: 'entry',
    title: 'Entry',
    desc: 'Ideal for small teams beginning to leverage advanced AI features.',
    price: '$180',
    priceNote: '(one-time payment)',
    features: [
      '1,600,000 Tokens',
      '3 free user accounts (additional user $25/user/month)',
      'Compatible with all Syncra AI modules',
      'Email & chat support (48-hour response)',
    ],
  },
  {
    id: 'growth',
    title: 'Growth',
    desc: 'Designed for growing teams with regular advanced AI usage.',
    price: '$342',
    priceNote: '(one-time payment)',
    features: [
      '3,200,000 Tokens',
      '3 free user accounts (additional user $25/user/month)',
      'Compatible with all Syncra AI modules',
      'Email & chat support (48-hour response)',
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    desc: 'Perfect for teams and departments running intensive AI-powered workflows.',
    price: '$486',
    priceNote: '(one-time payment)',
    features: [
      '4,800,000 Tokens',
      '5 free user accounts (additional user $25/user/month)',
      'Compatible with all Syncra AI modules',
      'Email & chat support (48-hour response)',
    ],
    highlight: true,
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    desc: 'The highest-value option for organizations with substantial AI demands.',
    price: '$612',
    priceNote: '(one-time payment)',
    features: [
      '6,400,000 Tokens',
      '10 free user accounts (additional user $25/user/month)',
      'Compatible with all Syncra AI modules',
      'Email & chat support (48-hour response)',
    ],
  },
]

useHead({
  titleTemplate: 'Pricing - %s',
})
</script>

<template>
  <LayoutDefault
    size="!max-w-[120rem]"
    padding-top="pt-10"
  >
    <section>
      <h1 class="text-4xl py-6 font-semibold text-center text-highlighted">
        Plans & Pricing
      </h1>
      <!-- Horizontal scroll on small screens -->
      <div class="w-full mx-auto px-2 sm:px-2 lg:px-2 scroll-pt-10 pt-12 lg:pt-5 pb-10">
        <div class="grid gap-2  lg:min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <div
            v-for="p in plans"
            :key="p.id"
            class="rounded-lg bg-default flex flex-col ring ring-default p-5"
          >
            <div>
              <div>
                <div class="space-y-2 justify-between">
                  <h3 class="text-[26px] font-semibold text-gray-900">
                    {{ p.title }}
                  </h3>
                  <p class="text-sm leading-relaxed h-[55px]">
                    {{ p.desc }}
                  </p>
                </div>
              </div>
              <div class=" my-3">
                <div class="mt-auto pt-5 flex gap-2 flex-wrap items-baseline">
                  <div
                    v-if="p.billing"
                    class="text-sm font-medium"
                  >
                    Starting from:
                  </div>
                  <div class="text-4xl font-semibold text-primary">
                    {{ p.price }}
                  </div>
                  <div
                    v-if="p.billing"
                    class="text-sm pb-1"
                  >
                    {{ p.billing }}
                  </div>

                  <div
                    v-if="p.priceNote"
                    class="text-sm pb-1"
                  >
                    {{ p.priceNote }}
                  </div>
                </div>
              </div>
              <div class="mt-auto pt-7">
                <div class="text-xl font-semibold text-gray-900">
                  Key Features
                </div>
                <ul class="mt-3 space-y-2 text-sm text-gray-600">
                  <li
                    v-for="(f, idx) in p.features"
                    :key="idx"
                    class="flex gap-2"
                  >
                    <UIcon
                      name="lucide:check"
                      class="min-h-4 min-w-4 text-gray-700 mt-1"
                    />
                    <span class="leading-relaxed">{{ f }}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="mt-auto pt-7">
              <button
                class="rounded-2xl p-4 bg-primary hover:bg-primary/75 w-full transition-all cursor-pointer text-white"
                @click="open.contactSale = true"
              >
                <span class="font-semibold text-lg">Contact Us</span><br>
                <span class="text-sm">(Free consultation & setup cost quote)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <UModal
      v-model:open="open.contactSale"
      title="Contact Sales"
      description="A member of our team will be in touch soon."
      class="max-w-3xl"
      scrollable
      :ui="{
        content: 'max-h-[95dvh] flex flex-col overflow-hidden',
        header: 'min-h-auto shrink-0',
        body: 'flex-1 min-h-0 overflow-y-auto overscroll-contain [&]:[-webkit-overflow-scrolling:touch]',
      }"
    >
      <template #body>
        <FormContactSale
          v-model:data="data"
          :module-items="moduleData"
          :pending
          @submit="onSubmit"
        />
      </template>
    </UModal>

    <ModalSuccess v-model="open.success" />
  </LayoutDefault>
</template>
