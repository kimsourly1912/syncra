<script setup lang="ts">
import { HotTable } from '@handsontable/vue3'
import 'handsontable/styles/handsontable.min.css'
import 'handsontable/styles/ht-theme-main.min.css'
import { registerAllModules } from 'handsontable/registry'
import type { GridSettings } from 'handsontable/settings'
import 'handsontable/styles/ht-theme-horizon.min.css'
import { useResizeObserver, unrefElement } from '@vueuse/core'

export type ExcelPreviewTheme = 'dark' | 'light'
export type ExcelPreviewData = GridSettings['data']

const elRef = useTemplateRef('el-ref')

registerAllModules()

const defaultRowCount = 50
const defaultColumnCount = 26

const props = defineProps<{
  theme?: ExcelPreviewTheme
  data: ExcelPreviewData | undefined | null
}>()

const settings = ref<GridSettings>({
  rowHeaders: true,
  colHeaders: true,
  manualRowResize: true,
  manualColumnResize: true,
  stretchH: 'all',
  autoWrapCol: true,
  autoWrapRow: true,
  themeName: '',
  startRows: defaultRowCount, // default row if data empty
  startCols: defaultColumnCount, // default col if data empty
  readOnly: false,
  wordWrap: true,
  licenseKey: 'non-commercial-and-evaluation',
  // height: '100vh',
})

// function is2DArray(data: unknown[]) {
//   return Array.isArray(data) && Array.isArray(data[0])
// }

// function isArrayObject(data: unknown[]): data is object[] {
//   return Array.isArray(data) && isPlainObject(data[0])
// }

function findMaxColumnCount(data: NonNullable<ExcelPreviewData>) {
  let maxColumnCount = 0
  for (const d of data) {
    if (isPlainObject(d)) {
      const length = Object.keys(d).length
      if (maxColumnCount < length) {
        maxColumnCount = length
      }
    }
    if (Array.isArray(d)) {
      const length = d.length
      if (maxColumnCount < length) {
        maxColumnCount = length
      }
    }
  }
  return maxColumnCount
}

function findMaxRowCount(data: NonNullable<ExcelPreviewData>) {
  return data.length
}

function fillColumnGap(data: unknown, value: unknown, length: number) {
  if (isPlainObject(data)) {
    for (let i = 0; i < length; i++) {
      const d = data as Record<number, unknown>
      if (!d[i]) {
        d[i] = value
      }
    }
  }
  if (Array.isArray(data)) {
    for (let i = 0; i < length; i++) {
      data.push(value)
    }
  }
}

const fillDataGap = computed(() => {
  if (!props.data) return null
  const d = [...props.data]
  const maxRowCount = Math.max(findMaxRowCount(d), defaultRowCount) - findMaxRowCount(d)
  const maxColumnCount = Math.max(findMaxColumnCount(d), defaultColumnCount) - findMaxColumnCount(d)

  fillColumnGap(d[0], [], maxColumnCount)

  for (let i = 0; i < maxRowCount; i++) {
    d.push([])
  }
  return d
})

watch(() => props.theme, (theme) => {
  settings.value.themeName = 'ht-theme-main'
  if (!theme) return
  const themeName = theme === 'dark' ? 'ht-theme-main-dark' : 'ht-theme-main'
  settings.value.themeName = themeName
}, { immediate: true })

useResizeObserver(document.body, () => {
  const el = unrefElement(elRef)
  if (!el) return
  const previousSibling = el.previousElementSibling as HTMLElement
  if (!previousSibling) return
  const rect = previousSibling.getBoundingClientRect()
  settings.value.height = `calc(100vh - ${rect.height}px)`
})
</script>

<template>
  <HotTable
    ref="el-ref"
    :data="fillDataGap"
    :settings
  />
</template>
