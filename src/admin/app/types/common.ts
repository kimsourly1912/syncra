// extract the nested object value
export type DeepValue<T>
  = T extends object
    ? { [K in keyof T]: DeepValue<T[K]> }[keyof T]
    : T

export type ExtractObjectValue<T> = DeepValue<T>

export type SchemaToString<T> = {
  [K in keyof T]: K
}
export type AcceptLiteral<T extends string> = T | ({} & string)
