<script setup lang="ts">
import { getMarketingContent } from '@/services/module.service'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data, submit, open, pending } = useContactSale()

watch(() => open.contactSale, (val) => {
  if (val) {
    data.modules = [slug.value]
  }
})
const onSubmit = submit()


const { data: marketingContent, status } = useAsyncData('marketing-content',
  async () => {
    const { data } = await getMarketingContent(slug.value)
    return data
  }, { lazy: true })

watch(marketingContent, () => {
  useHead({
    titleTemplate: marketingContent.value ? `Learn More - ${marketingContent.value.moduleName}` : 'Learn More - %s',
  })
})
</script>

<template>
  <LayoutDefault>
    <template v-if="marketingContent">
      <section>
        <NuxtImg
          v-if="marketingContent?.coverUrl"
          :src="marketingContent?.coverUrl"
          :alt="marketingContent?.moduleName"
          class="w-full rounded-xl"
        />
      </section>
      <UCard class="mx-auto mt-8 space-y-6 rounded-2xl">
        <p
          v-for="(paragraph, idx) in marketingContent?.description.split('<br>')"
          :key="idx"
          class="text-lg text-muted leading-relaxed"
        >
          {{ paragraph }}
          <br><br>
        </p>
      </UCard>
      <div class="flex flex-col items-center gap-20 *:md:flex-row justify-center mt-10 mb-20 flex-wrap">
        <UButton
          icon="lucide:arrow-right"
          color="neutral"
          variant="outline"
          size="xl"
          label="Contact Sales"
          @click="open.contactSale = true"
        />
      </div>
    </template>

    <template v-else-if="status !== 'pending'">
      <main>
        <main class="w-full flex items-center justify-center px-4">
          <section class="flex flex-col items-center justify-center text-center">
            <NuxtImg
              src="/img/originals/coming.png"
              alt="Coming Soon"
              class="mb-8 w-full max-w-sm sm:max-w-md md:max-w-lg"
              :format="'avif'"
              quality="100"
            />
            <h1 class="text-4xl font-bold mb-4 text-primary tracking-widest">
              COMING SOON
            </h1>
            <p class="text-lg text-muted tracking-widest">
              ARE YOU READY?
            </p>
          </section>
        </main>
      </main>
    </template>

    <ModalContactSale v-model="open.contactSale">
      <FormContactSale
        v-model:data="data"
        :pending
        @submit="onSubmit"
      />
    </ModalContactSale>

    <ModalSuccess v-model="open.success" />
  </LayoutDefault>
</template>
