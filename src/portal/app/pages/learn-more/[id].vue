<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
// import FormContactSale from '@/features/workspace/components/form/FormContactSale.vue'
import type { IContactSaleSchema } from '@/schema/contact-sale.schema'
import * as moduleService from '@/services/module.service'

const route = useRoute()
const id = route.params.id as unknown as number
const contactSale = useContactSale()
const profileStore = useProfileStore()
const disabledInterestedProduct = shallowRef(false)
const open = reactive({
  contactSale: false,
  completeProfile: false,
  successContactSale: false,
})
const { data, status } = useAsyncData('marketing-content',
  async () => {
    const { data } = await moduleService.getModule({ id })
    return data
  },
  { lazy: true },
)
const { execute: contactSaleExecute, pending: contactSalePending } = useAsyncData(
  () => contactSale.createContactSale(contactSale.bodyReq.value, () => {
    open.contactSale = false
  }),
  { immediate: false },
)

function onSubmitContactSale(_: FormSubmitEvent<IContactSaleSchema>) {
  contactSaleExecute()
}

// function openContact(type: string) {
//   onOpen()
//   if (type.length) {
//     disabledInterestedProduct.value = true
//     contactSale.data.interestedProduct = [type]
//   }
// }

// function onOpen() {
//   contactSale.clearAll()
//   if (profileStore.onboarded) {
//     open.completeProfile = false
//     open.contactSale = true
//   }
//   else {
//     open.contactSale = false
//     open.completeProfile = true
//   }
// }
watch(data, () => {
  useHead({
    titleTemplate: data.value ? `Learn More - ${data.value.moduleName}` : 'Learn More - %s',
  })
})
definePageMeta({
  layout: 'default',
})
</script>

<template>
  <UDashboardPanel id="learn-more">
    <template #header>
      <LayoutHeader title="Learn More" />
    </template>
    <template #body>
      <LayoutContent>
        <div>
          <div
            v-if="data"
          >
            <section>
              <NuxtImg
                v-if="data.coverUrl"
                :src="data.coverUrl"
                :alt="data.moduleName"
                quality="100"
                class="  w-full rounded-xl"
                :format="'avif'"
              />
            </section>
            <UCard class="mx-auto mt-8 space-y-6 rounded-2xl">
              <p
                v-for="(paragraph, idx) in data!.description.split('<br>')"
                :key="idx"
                class="text-lg text-muted leading-relaxed"
              >
                {{ paragraph }}
                <br><br>
              </p>
            </UCard>
            <!-- <div class="flex flex-col items-center gap-20 *:md:flex-row justify-center mt-10 mb-20 flex-wrap">
              <UButton
                icon="lucide:arrow-right"
                color="neutral"
                variant="outline"
                size="xl"
                label="Contact Sales"

                @click="openContact('')"
              />
            </div> -->
          </div>
          <div v-else-if="status ==='success'">
            <main class="w-full flex items-center justify-center px-12">
              <section class="max-w-4xl w-full py-12 flex flex-col items-center justify-center">
                <NuxtImg
                  src="/img/coming.png"
                  alt="Coming Soon"
                  width="384"
                  height="384"
                />
                <h1 class="text-md xl:text-4xl font-bold mb-6 text-center text-primary">
                  C O M I N G  S O O N
                </h1>
                <p class=" text-sm xl:text-lg mb-4 text-muted">
                  A R E   Y O U R   E A D Y ?
                </p>
              </section>
            </main>
          </div>
          <div>
            <UModal
              v-model:open="open.contactSale"
              class="max-w-xl"
              scrollable
              :ui="{
                header: 'min-h-auto',
              }"
              title="Contact Sales"
              description="A member of our team will be in touch soon."
            >
              <template #body>
                <FormContactSale
                  v-model:data="contactSale.data"
                  :module-items="[]"
                  :field-name="contactSale.FIELD_NAME"
                  :loading="contactSalePending || profileStore.pending"
                  :disabled-interested-product="disabledInterestedProduct"
                  @submit="onSubmitContactSale"
                />
              </template>
            </UModal>
          </div>
        </div>
      </LayoutContent>
    </template>
  </UDashboardPanel>
</template>
