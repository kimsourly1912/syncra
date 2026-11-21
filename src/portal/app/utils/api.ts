// const EXAMPLE_ENDPOINT = {
//   prefix: '/workspaces/company',
//   parts: {
//     plan: 'plan',
//     status: 'status',
//     subscriptions: 'subscriptions',
//   },
// } as const

// type ExampleEndpointPart<T> = keyof typeof EXAMPLE_ENDPOINT.parts | ({} & string | number)

/**
 * Note: must pass by the order of what our endpoint required
 */

// TODO: remove this when merged completed
type DeepValue<T>
  = T extends object
    ? { [K in keyof T]: DeepValue<T[K]> }[keyof T]
    : T

type EndpointPart<T> = DeepValue<T> | ({} & string | number)

export function buildEndPoint<P>(prefix: string, parts: EndpointPart<P>[]) {
  return `${prefix}/${parts.join('/')}`
}

export function buildEndpoint<T extends string>(prefix: T) {
  return (...endpoint: (T | {} & string | number)[]) => {
    return `/${prefix}/${endpoint.join('/')}`
  }
}
