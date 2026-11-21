import type { ProfileDTO } from '@/types/dto'

const PREFIX = {
  admin: 'admin',
}

export const PARTS = {
  me: 'me',
  users: 'users',
  profile: 'profile',
} as const

type Parts = typeof PARTS

export function getProfile() {
  const endpoint = buildEndPoint<Parts>(PREFIX.admin, ['users', 'me', 'profile'])
  return useAPI<ProfileDTO.ProfileRes>(endpoint, { method: 'GET' })
}
