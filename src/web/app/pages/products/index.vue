<script lang="ts" setup>
const { moduleExecute, moduleData } = useModule()

moduleExecute()

useHead({
  titleTemplate: 'Products - %s',
})
</script>

<template>
  <LayoutDefault>
    <div>
      <main>
        <h1 class="text-4xl font-semibold text-center text-highlighted">
          Syncra Modules
        </h1>

        <p class="lg:text-lg text-muted mt-10 mb-8 text-center">
          Each module is a digital building block in your intelligent supply chain ecosystem
        </p>

        <ul class="mt-14 grid sm:grid-cols-2 lg:grid-cols-3  xl:grid-cols-4 gap-10">
          <li
            v-for="(o, idx) in moduleData"
            :key="idx"
            class="flex flex-col gap-5 p-5 bg-default transition-all ring ring-accented rounded-lg"
          >
            <div>
              <div class="space-y-2.5">
                <NuxtImg
                  class="size-14"
                  :src="o.iconUrl"
                />
                <h1 class="text-highlighted text-xl font-semibold ">
                  {{ o.name }}
                </h1>
              </div>
              <p class="text-sm text-muted mt-2">
                {{ o.description }}
              </p>
            </div>
            <UButton
              label="Learn more"
              :to="`/products/${o.id}`"
              block
              variant="outline"
              class="mt-auto flex items-center gap-4"
            >
              <NuxtImg
                src="/img/bookmark.png"
                alt="Learn more"
                class="w-3 h-3"
              />
              <span class="text-sm font-medium">Learn more</span>
            </UButton>
          </li>
        </ul>
      </main>
    </div>
  </LayoutDefault>
</template>
