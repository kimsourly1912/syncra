<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])
const logs = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
const openList = ref([])

const toggleFiles = (index) => {
  openList.value[index] = !openList.value[index]
}
</script>

<template>
  <UCard class="h-240 overflow-y-auto">
    <div
      v-for="(group, gIdx) in logs"
      :key="gIdx"
      class="rounded-2xl relative overflow-y-auto"
    >
      <h2 class="text-2xl font-bold mb-2">
        {{ group.orderDate }}
      </h2>

      <div class="relative pl-10">
        <div class="absolute left-4 top-0 bottom-0 w-[2px] bg-gray-300" />

        <div
          v-for="(log, index) in group.product"
          :key="index"
          class="mb-10 relative"
        >
          <div class="absolute -left-10">
            <div class="w-8 h-8 bg-purple-100 border border-purple-300 rounded-full flex items-center justify-center">
              <UIcon
                name="lucide:file-text"
                class="text-purple-400 w-4 h-4"
              />
            </div>
          </div>
          <p class="text-sm text-gray-700 font-semibold mb-2">
            {{ log.time }}
          </p>
          <UCard class="rounded-xl shadow-sm border border-gray-200">
            <div class=" grid  xl:grid-cols-2 items-start justify-between gap-2">
              <div class="flex gap-5">
                <div class=" w-10 h-10 xl:w-12 xl:h-12 rounded-full bg-sky-500 text-white flex items-center justify-center font-semibold p-3">
                  {{ log.user.name.split(' ')[0][0] }}{{ log.user.name.split(' ')[1][0] }}
                </div>

                <div>
                  <h3 class="font-semibold text-gray-800">
                    {{ log.user.name }}
                  </h3>
                  <p class="text-sm text-gray-500 -mt-1">
                    {{ log.user.email }}
                  </p>

                  <p class="mt-2 text-gray-700">
                    <span class="font-semibold">{{ log.user.name }}</span>
                    processed
                    <span class="text-blue-600 font-medium">{{ log.pid }}</span>
                    in the
                    <span class="text-teal-600 font-medium">{{ log.module }}</span>
                    {{ log.moduleType }}
                  </p>

                  <p class="text-sm text-gray-500 mt-3">
                    Processed at:
                    <span class="font-semibold text-gray-800">{{ log.date }}</span>
                  </p>

                  <p
                    class="text-sm text-gray-600 mt-1 flex items-center gap-1 cursor-pointer select-none"
                    @click="toggleFiles(index)"
                  >
                    File
                    <UIcon :name="openList[index] ? 'lucide:chevron-up' : 'lucide:chevron-down'" />
                  </p>
                  <div
                    v-if="openList[index]"
                    class="py-3 w-full rounded-lg space-y-3"
                  >
                    <div
                      v-for="(file, fIndex) in log.files"
                      :key="fIndex"
                      class="w-full"
                    >
                      <UCard class="bg-accented w-full ">
                        <div class="w-full grid grid-cols-1 xl:grid-cols-2 items-center gap-4">
                          <!-- File Info -->
                          <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-[#5fcdcda6] rounded-full flex items-center justify-center p-3">
                              <UIcon
                                name="lucide:file"
                                class="text-green-600"
                              />
                            </div>
                            <div class="grid grid-rows-2 text-sm font-medium">
                              <span>{{ file.name }}</span>
                              <span>{{ file.status }}</span>
                            </div>
                          </div>

                          <!-- Token Section -->
                          <div class="flex flex-col-1 justify-start xl:justify-end items-center gap-3">
                            <p class="text-sm text-gray-700">
                              Token Comment:
                            </p>
                            <div class="w-10 h-10 bg-linear-to-t from-[#4bb8ab37] to-[#61bedd40] rounded-full flex items-center justify-center p-2">
                              <NuxtImg
                                src="/img/coin.png"
                                class="bg-white rounded-full"
                              />
                            </div>
                            <span class="inline-flex items-center">
                              <UIcon name="lucide:coins" />
                              {{ log.token }}
                            </span>
                          </div>
                        </div>
                      </UCard>
                    </div>
                  </div>
                </div>
              </div>

              <div class="text-left xl:text-right">
                <div
                  class="px-3 py-1 rounded-full text-sm font-medium inline-flex border items-center gap-1"
                  :class="{
                    'text-green-600 border-green-300 bg-green-50': log.statusColor === 'green',
                    'text-orange-600 border-orange-300 bg-orange-50': log.statusColor === 'orange',
                    'text-red-600 border-red-300 bg-red-50': log.statusColor === 'red',
                  }"
                >
                  <UIcon
                    :name="log.statusColor === 'green' ? 'lucide:check' : log.statusColor === 'red' ? 'lucide:circle-x' : 'lucide:alert-circle'"
                    class="w-4 h-4"
                  />
                  {{ log.status }}
                </div>

                <div class="mt-2 flex flex-col-2 justify-start xl:justify-end items-center py-3 gap-3">
                  <p class="text-sm text-gray-700">
                    Token Used:
                  </p>
                  <div class="w-8 h-8 bg-linear-to-t from-[#4bb8ab37] to-[#61bedd40] p-1.5 rounded-full">
                    <NuxtImg
                      src="/img/coin.png"
                      class="bg-white rounded-full"
                    />
                  </div>
                  <span class="inline-flex items-center">
                    <UIcon name="lucide:coins" />
                    {{ log.token }}
                  </span>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </UCard>
</template>
