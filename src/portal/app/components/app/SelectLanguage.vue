<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'

const { locales, setLocale } = useI18n()
type Locale = Parameters<typeof setLocale>[0]

function useLanguage() {
  const locale = useCookieLocale()
  const selected = shallowRef(locale.value as Locale)

  const flag = computed(() => selected.value === 'en' ? 'flag:england' : 'flag:china')
  const items = locales.value
    .map<SelectItem>((o) => {
      const isEnglish = o.code === 'en'
      return {
        value: o.code,
        label: isEnglish ? 'English' : '简体中文',
        icon: isEnglish ? 'flag:england' : 'flag:china',
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
