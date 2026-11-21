import * as v from 'valibot'
import { ApiError } from './errors'

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

/** Validates API data against a model and returns the parsed model, or throws `ApiError` kind `contract`. */
export function parseData<S extends v.GenericSchema>(schema: S, data: unknown, source: string): v.InferOutput<S> {
  const result = v.safeParse(schema, data)
  if (result.success) return result.output
  const issues = result.issues.map(issue => `${v.getDotPath(issue) ?? '(response)'}: ${issue.message}`)
  throw new ApiError({ kind: 'contract', message: `Unexpected response from ${source} (${issues.join('; ')})`, source, issues })
}
