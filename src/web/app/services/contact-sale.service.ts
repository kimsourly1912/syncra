import type { ContactSaleReq, ContactSaleRes } from '@/types/dto/contact-sale.dto'

const PREFIX = '/public-marketing/contact-sales'

export const PARTS = {
  anonymouse: 'anonymouse',
} as const

type Parts = typeof PARTS

export function createContactSale(req: ContactSaleReq) {
  const endpoint = buildEndPoint<Parts>(PREFIX, ['anonymouse'])
  return useAPI<ContactSaleRes>(endpoint, { body: req, method: 'POST' })
}
