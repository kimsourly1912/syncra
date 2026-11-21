import type { ContactSaleDTO } from '@/types/dto'

export const PREFIX = {
  company: '/company',
  saleRequests: '/sale-requests',
}

export const PARTS = {
  submit: 'submit',
  token: 'token',
  contactSale: 'contact-sales',
} as const

type Part = typeof PARTS

export function createContactSale(req: ContactSaleDTO.ContactSaleReq) {
  return useAPI<ContactSaleDTO.ContactSaleRes>(buildEndPoint<Part>(PREFIX.company, ['contact-sales', 'submit']), { method: 'POST', body: req })
}

export function createRequestToken(req: ContactSaleDTO.RequestTokenReq) {
  return useAPI<ContactSaleDTO.RequestTokenRes>(buildEndPoint<Part>(PREFIX.saleRequests, ['token']), { method: 'POST', body: req })
}
