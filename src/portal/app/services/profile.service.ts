import type { ProfileDTO } from '@/types/dto'

const prefix = {
  me: 'me',
  settings: 'settings',
} as const

export const ENDPOINT = {
  prefix,
  parts: {
    logo: 'logo',
    profile: 'profile',
    updateDetail: 'update-detail',
    uploadProfile: 'upload-profile',
    changePassword: 'change-password',
    companyProfile: 'company-profile',
    updateRepresentative: 'update-representative',
  },
} as const

type Parts = typeof ENDPOINT.parts

const me = `/${ENDPOINT.prefix.me}`
const settings = `/${ENDPOINT.prefix.settings}`

export function getProfile() {
  const endpoint = buildEndPoint<Parts>(me, ['profile'])
  return useAPI<ProfileDTO.ProfileRes>(endpoint, { method: 'GET' })
}

export function updateProfile(req: ProfileDTO.UpdateProfileReq) {
  const endpoint = buildEndPoint<Parts>(me, ['profile'])
  return useAPI<ProfileDTO.UpdateProfileRes>(endpoint, { body: req, method: 'POST' })
}

export function uploadAvatar(req: ProfileDTO.UploadAvatarReq) {
  const endpoint = buildEndPoint<Parts>(me, ['logo'])
  return useAPI<ProfileDTO.UploadAvatarRes>(endpoint, { body: req, method: 'POST' })
}

export function removeAvatar() {
  const endpoint = buildEndPoint<Parts>(me, ['logo'])
  return useAPI<ProfileDTO.UploadAvatarRes>(endpoint, { method: 'DELETE' })
}

export function changePassword(req: ProfileDTO.ChangePasswordReq) {
  const endpoint = buildEndPoint<Parts>(me, ['change-password'])
  return useAPI<ProfileDTO.ChangePasswordRes>(endpoint, { body: req, method: 'POST' })
}

export function updateCompanyDetail(param: ProfileDTO.UpdateCompanyDetailParam, req: ProfileDTO.UpdateCompanyDetailReq) {
  const { companyId } = param
  const endpoint = buildEndPoint<Parts>(settings, ['company-profile', companyId, 'update-detail'])
  return useAPI<ProfileDTO.UpdateCompanyDetailRes>(endpoint, { body: req, method: 'PUT' })
}

export function updateRepresentativeDetail(param: ProfileDTO.UpdateRepresentativeParam, req: ProfileDTO.UpdateRepresentativeReq) {
  const { companyId } = param
  const endpoint = buildEndPoint<Parts>(settings, ['company-profile', companyId, 'update-representative'])
  return useAPI<ProfileDTO.UpdateRepresentativeRes>(endpoint, { body: req, method: 'PUT' })
}
