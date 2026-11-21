<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'

const { locales, setLocale } = useI18n()
type Locale = Parameters<typeof setLocale>[0]

function useLanguage() {
  const locale = useCookieLocale()
  const selected = shallowRef(locale.value as Locale)
  const flag = computed(() => 'flag:england')
  const items = locales.value
    .map<SelectItem>((o) => {
      return {
        value: o.code,
        label: 'English',
        icon: 'flag:england',
      }
    })

  watch(selected, (v) => {
    setLocale(v)
  }, { immediate: true })

  return {
    flag,
    items,
    locales,
    selected,
  }
}

const language = useLanguage()
</script>

<template>
  <USelect
    v-model="language.selected.value"
    :icon="language.flag.value"
    variant="subtle"
    arrow
    :items="language.items"
    class="w-full"
  />
</template>
