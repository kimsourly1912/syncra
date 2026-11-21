import type { ModuleDTO } from '@/types/dto'

const PREFIX = {
  workspaces: 'workspaces',
  companies: 'companies',
} as const

export const ENDPOINT = {
  modules: 'modules',
  access: 'access',
} as const

type Parts = keyof typeof ENDPOINT

export function findModules(query: ModuleDTO.ModuleQuery) {
  const endpoint = buildEndPoint<Parts>(PREFIX.workspaces, ['modules'])
  return useAPI<ModuleDTO.ModuleRes>(endpoint, { method: 'GET', query })
}

export function getModule(param: ModuleDTO.ModuleDetailParam) {
  const endpoint = buildEndPoint<Parts>(PREFIX.workspaces, ['modules', param.id, 'marketing-content'])
  return useAPI<ModuleDTO.MarketingContentRes>(endpoint, { method: 'GET' })
}

export function getModulesAccess(param: ModuleDTO.ModuleAccessParam) {
  const { companyId } = param
  const endpoint = buildEndPoint<Parts>(PREFIX.companies, [companyId, 'modules', 'access'])
  return useAPI<ModuleDTO.ModuleAccessRes>(endpoint, { method: 'GET' })
}
