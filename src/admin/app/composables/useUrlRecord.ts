/**
 * The id of a record open in a panel on a list, kept in the URL (`/lead-inquiry?lead=7`), so
 * reload and shared links open the same record. Anything that isn't a positive whole number reads
 * as none. Opening and closing replace the URL instead of adding history entries, so Back leaves
 * the list rather than stepping through panels. Other query values are kept.
 *
 * Changing a list filter (`useListQuery`) drops this parameter, so the panel closes.
 *
 * @example
 * const lead = useUrlRecord('lead')
 * lead.id.value      // 7, or undefined
 * lead.open(7)
 * lead.close()
 */
export function useUrlRecord(param: string) {
  const route = useRoute()
  const router = useRouter()

  const id = computed(() => {
    const value = Number(route.query[param])
    return Number.isInteger(value) && value > 0 ? value : undefined
  })

  function set(next: number | undefined) {
    const { [param]: _, ...query } = route.query
    return router.replace({ query: next === undefined ? query : { ...query, [param]: String(next) } })
  }

  return {
    id,
    open: (next: number) => set(next),
    close: () => set(undefined),
  }
}
