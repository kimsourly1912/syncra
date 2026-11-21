import * as v from 'valibot'

// Hand-written pieces of the API contract. Everything generated lives in ./generated.

/** Body of a thrown request error. The spec documents no error responses, so this isn't generated. */
export interface ApiErrorBody {
  reason?: string
  msg?: string
  detail?: string
  title?: string
  status?: number
  type?: string
  instance?: string
}

/** The response doesn't have the shape a feature's model requires. */
export class ApiContractError extends Error {
  readonly source: string
  readonly issues: string[]

  constructor(source: string, issues: v.BaseIssue<unknown>[]) {
    const details = issues.map(issue => `${v.getDotPath(issue) ?? '(response)'}: ${issue.message}`)
    super(`Unexpected response from ${source} (${details.join('; ')})`)
    this.name = 'ApiContractError'
    this.source = source
    this.issues = details
  }
}

type ModelEntries<E extends v.ObjectEntries, R extends keyof E, O extends keyof E> = {
  [K in R | O]: K extends R ? v.NonNullishSchema<E[K], undefined> : E[K]
}

/**
 * Builds a feature model from a generated schema. The spec marks every field optional and
 * nullable, so a model lists the fields the feature uses: `required` ones must be present
 * and not null, `optional` ones pass through as they are, and every other field is dropped.
 */
export function defineModel<
  E extends v.ObjectEntries,
  const R extends keyof E & string,
  const O extends Exclude<keyof E & string, R> = never,
>(schema: v.ObjectSchema<E, undefined>, fields: { required: readonly R[], optional?: readonly O[] }) {
  const entries: v.ObjectEntries = {}
  for (const key of fields.required) entries[key] = v.nonNullish(schema.entries[key]!)
  for (const key of fields.optional ?? []) entries[key] = schema.entries[key]!
  return v.object(entries) as v.ObjectSchema<ModelEntries<E, R, O>, undefined>
}

/** Validates API data against a model and returns the parsed model, or throws `ApiContractError`. */
export function parseData<S extends v.GenericSchema>(schema: S, data: unknown, source: string): v.InferOutput<S> {
  const result = v.safeParse(schema, data)
  if (result.success) return result.output
  throw new ApiContractError(source, result.issues)
}

interface Envelope {
  success?: boolean | null
  msg?: string | null
  reason?: string | null
  data?: unknown
}

export type ParsedEnvelope<T>
  = | { success: true, data: T, msg?: string }
    | { success: false, reason?: string, msg?: string }

/**
 * Parses a `ResponseMsg*` envelope. `data` is checked only when `success` is true, so a
 * resolved failure still reaches the caller's `if (!res.success)` branch.
 */
export function parseEnvelope<S extends v.GenericSchema>(res: Envelope, schema: S, source: string): ParsedEnvelope<v.InferOutput<S>> {
  const msg = res.msg ?? undefined
  if (res.success !== true) return { success: false, reason: res.reason ?? undefined, msg }
  return { success: true, data: parseData(schema, res.data, source), msg }
}
