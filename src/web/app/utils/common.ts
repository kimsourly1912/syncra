import type { DeepValue } from '@/types/common'

export const tw = String.raw

type EndpointPart<T> = DeepValue<T> | ({} & string | number)

export function buildEndPoint<P>(prefix: string, parts: EndpointPart<P>[]) {
  return `${prefix}/${parts.join('/')}`
}
