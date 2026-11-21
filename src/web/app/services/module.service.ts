import type { ModuleDTO } from '@/types/dto'

const PREFIX = {
  public: 'public',
} as const

export const ENDPOINT = {
  modules: 'syncra-modules',
  market: 'marketing-content',
} as const

type Parts = typeof ENDPOINT

export function findModules(query: ModuleDTO.ModuleQuery) {
  const endpoint = buildEndPoint<Parts>(PREFIX.public, ['syncra-modules'])
  return useAPI<ModuleDTO.ModuleRes>(endpoint, { method: 'GET', query })
}

export function getMarketingContent(moduleId: string) {
  const endpoint = buildEndPoint<Parts>(PREFIX.public, [
    'syncra-modules',
    moduleId,
    'marketing-content',
  ])

  return useAPI<ModuleDTO.ModuleMarketingContentRes>(endpoint, {
    method: 'GET',
  })
}
