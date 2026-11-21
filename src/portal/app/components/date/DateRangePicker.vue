<script setup lang="ts">
import type { DateValue } from 'reka-ui'
import { getLocalTimeZone, today, DateFormatter, CalendarDate } from '@internationalized/date'

export interface DateRange {
  end: DateValue | undefined
  start: DateValue | undefined
}

interface Item {
  label: string
  value: DateRange
}

const timeZone = getLocalTimeZone()
const getToday = () => today(timeZone)
const minDate = new CalendarDate(2022, 1, 1)

const ranges = [
  { label: 'All time', type: 'all', value: -1 },
  { label: 'Today', type: 'day', value: 0 },
  { label: 'Last 7 days', type: 'day', value: 7 },
  { label: 'Last month', type: 'month', value: 1 },
  { label: 'Last 3 months', type: 'month', value: 3 },
  { label: 'Last 6 months', type: 'month', value: 6 },
  { label: 'Last year', type: 'year', value: 1 },

] as const

const items = ranges.map<Item>((o) => {
  const resolve = (v: 'day' | 'month' | 'year') => {
    switch (v) {
      case 'day': {
        return 'days'
      }
      case 'month': {
        return 'months'
      }
      default : {
        return 'years'
      }
    }
  }
  const start = o.type === 'all' ? undefined : getToday().subtract({ [resolve(o.type)]: o.value })
  const end = o.type === 'all' ? undefined : getToday()
  return {
    label: o.label,
    value: { start, end },
  }
})

function isAllTime(v: DateRange) {
  return v.start === undefined && v.end === undefined
}

const value = shallowRef<DateRange>(items[items.length - 1]!.value)
const model = defineModel<DateRange>({
  default: {
    end: undefined,
    start: undefined,
  },
})

const btnLabel = computed(() => {
  const v = model.value
  if (isAllTime(v)) return 'All time'
  return `${formatFullDate(v.start)} - ${formatFullDate(v.end)}`
})

const selectLabel = computed(() => {
  const v = value.value
  if (isAllTime(v)) return 'All time'
  return `${formatFullDate(v.start)} - ${formatFullDate(v.end)}`
})

const disabled = computed(() => {
  const v = value.value
  if (isAllTime(v)) return false
  return !v.start || !v.end
})

const toDate = (v: DateValue) => v.toDate(timeZone)

function formatFullDate(v: DateValue | undefined) {
  if (!v) return ''
  const f = new DateFormatter('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
  return f.format(toDate(v)).replace(',', '')
}

function onApply() {
  model.value = value.value
}

function onSelect(v: DateRange) {
  value.value = v
}

function clear() {
  value.value = model.value
}

function onOpen(v: boolean) {
  if (v)
    clear()
}

function isActive(v: DateRange) {
  return JSON.stringify(v) === JSON.stringify(value.value)
}
</script>

<template>
  <UPopover
    :content="{
      align: 'end',
    }"
    :ui="{
      content: 'w-[min(92vw,28rem)] max-h-[85vh] overflow-y-auto',
    }"
    @update:open="onOpen"
  >
    <UButton
      :label="btnLabel"
      color="neutral"
      variant="outline"
      icon="lucide:calendar"
      trailing-icon="lucide:chevron-down"
      class="min-w-44 w-auto"
      :ui="{
        label: 'flex-1 text-left whitespace-nowrap',
      }"
    />

    <template #content="{ close }">
      <section class="p-3 grid grid-cols-1 sm:grid-cols-12">
        <section class="pb-3 border-b sm:pb-0 sm:border-b-0 sm:pr-3 sm:border-r border-default col-span-full sm:col-span-4">
          <ul class="space-y-1">
            <li
              v-for="(o, idx) in items"
              :key="idx"
            >
              <UButton
                class="w-full cursor-pointer"
                :label="o.label"
                :color="isActive(o.value) ? 'primary' : 'neutral'"
                :variant="isActive(o.value) ? 'soft' : 'ghost'"
                @click="onSelect(o.value)"
              />
            </li>
          </ul>
        </section>
        <section class="pt-3 sm:pt-0 sm:pl-4 space-y-4 col-span-full sm:col-span-8">
          <UCalendar
            v-model="value"
            range
            prevent-deselect
            class="w-full"
            :min-value="minDate"
          />

          <USeparator />

          <section class="flex items-center justify-between gap-4 flex-wrap">
            <span class="text-sm text-primary font-medium">{{ selectLabel }}</span>
            <UButton
              label="Apply"
              :disabled="disabled"
              @click="() => {
                close()
                onApply()
              }"
            />
          </section>
        </section>
      </section>
    </template>
  </UPopover>
</template>
