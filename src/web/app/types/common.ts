export type ObjectValueToString<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends string ? string : string
}

export type DeepValue<T>
  = T extends object
    ? { [K in keyof T]: DeepValue<T[K]> }[keyof T]
    : T
