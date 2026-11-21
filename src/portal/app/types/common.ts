// extract the nested object value
export type DeepValue<T>
  = T extends object
    ? { [K in keyof T]: DeepValue<T[K]> }[keyof T]
    : T

export type ExtractObjectValue<T> = DeepValue<T>

export type ObjectValueToString<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends string ? string : string
}

export type SchemaToString<T> = {
  [K in keyof T]: K
}

/**
 * This `AcceptLiteral` is useful when we want to keep
 * the union type and still enjoy the literal
 */
export type AcceptLiteral<T extends string> = T | ({} & string)
export type OmitNullish<T> = T extends string ? T : never
export type MaybeNullish<T> = T | null | undefined
