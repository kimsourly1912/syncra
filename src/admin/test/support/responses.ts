// API response bodies for fakes, shared by the Nuxt tests (through fake-api.ts) and the e2e tests,
// which can't load `@/api`. No imports, so both can use it.

/** A `ResponseMsg*` success envelope. */
export const ok = <T = null>(data: T = null as T) => ({ success: true, msg: 'ok', reason: null, data })

/** One page of an Admin list endpoint (`LeadInquiryListingResponse` and the like): the rows, unenveloped. */
export const listPage = <T>(items: T[], totalPages = 1) => ({ page: 0, size: 20, totalItems: items.length, totalPages, items })

/** A `ResponseMsg*` resolved failure. */
export const refused = (reason: string) => ({ success: false, msg: null, reason, data: null })
