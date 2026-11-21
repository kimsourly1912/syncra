/**
 * A page's tab kept in the URL (`/account/12?tab=token`), so reload and shared links open the
 * same tab. The first tab is the default and is left out of the URL; an unknown value reads as
 * it. Switching tabs replaces the URL instead of adding a history entry, so Back leaves the page.
 * Other query values on the page are kept.
 *
 * @example
 * const tab = useUrlTab(['company-information', 'module', 'token'] as const)
 * <UTabs v-model="tab" :items="tabItems" :content="false" />
 */
export function useUrlTab<T extends string>(tabs: readonly T[], param = 'tab') {
  const route = useRoute()
  const router = useRouter()

  return computed<T>({
    get: () => {
      const value = route.query[param]
      return typeof value === 'string' && (tabs as readonly string[]).includes(value) ? value as T : tabs[0]!
    },
    set: (value) => {
      const { [param]: _, ...query } = route.query
      void router.replace({ query: value === tabs[0] ? query : { ...query, [param]: value } })
    },
  })
}
