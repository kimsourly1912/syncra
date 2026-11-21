type DeepValue<T>
  = T extends object
    ? { [K in keyof T]: DeepValue<T[K]> }[keyof T]
    : T

type EndpointPart<T> = DeepValue<T> | ({} & string | number)

export function buildEndPoint<P>(prefix: string, parts: EndpointPart<P>[]) {
  return `${prefix}/${parts.join('/')}`
}
