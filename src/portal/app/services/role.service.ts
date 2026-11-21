import type { RoleDTO } from '@/types/dto'

export const ENDPOINT = {
  role: '/user-roles/get-all',
} as const

export function getRoles() {
  return useAPI<RoleDTO.RoleRes>(ENDPOINT.role, { method: 'GET' })
}
