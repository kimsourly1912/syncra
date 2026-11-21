import type { OnboardingDTO } from '@/types/dto'

export const ENDPOINT = {
  detail: '/company/details',
  representive: '/company/representatives',
} as const

export function createRepresentative(req: OnboardingDTO.RepresentiveReq) {
  return useAPI<OnboardingDTO.RepresentiveRes>(ENDPOINT.representive, { body: req, method: 'POST' })
}

export function createCompanyDetail(req: OnboardingDTO.CompanyDetailReq) {
  return useAPI<OnboardingDTO.CompanyDetailRes>(ENDPOINT.detail, { body: req, method: 'POST' })
}
