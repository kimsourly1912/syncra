import { api } from '@/api'
import { tokenPackageListModel } from '../models/token-package'

/** The token packages customers can buy, read-only (the API has no write for them), in their sort order. */
export function useTokenPackages() {
  const packages = useApiQuery(
    'settings:token-packages',
    ({ signal }) => api.get('/admin/credits/packages', { signal, model: tokenPackageListModel }),
  )
  const sorted = computed(() => [...(packages.data.value ?? [])]
    .sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER)))
  return { ...packages, packages: sorted }
}
