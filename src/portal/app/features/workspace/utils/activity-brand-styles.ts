import type { DocAIDTO } from '@/types/dto'

export function activityBrandStyles(
  pairs: DocAIDTO.BrandStylePair[] | null | undefined,
  status: DocAIDTO.DocAIJobStatus,
): DocAIDTO.BrandStylePair[] {
  if (status === 'DRAFT' || status === 'PENDING' || status === 'PROCESSING') return []

  const seen = new Set<string>()
  return (pairs ?? []).reduce<DocAIDTO.BrandStylePair[]>((result, pair) => {
    const brand = normalize(pair.brand)
    const style = normalize(pair.style)
    if (brand === null && style === null) return result

    const key = JSON.stringify([brand, style])
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ brand, style })
    }
    return result
  }, [])
}

function normalize(value: string | null) {
  const text = value?.trim()
  return !text || text.toUpperCase() === 'N/A' ? null : text
}
