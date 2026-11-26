import { defineConfig } from '@hey-api/openapi-ts'

type SchemaNode = Record<string, unknown>

// The backend's spec (springdoc) under-describes what it sends. These patches make the
// generated contract match the JSON the browser actually receives. Required fields are
// still unknown; each feature declares the ones it needs in its model (see docs/data-access.md).
function normalizeSchema(node: unknown) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    node.forEach(normalizeSchema)
    return
  }
  const schema = node as SchemaNode

  // `fetch` parses JSON numbers into JS numbers, so int64 must not be coerced to BigInt.
  if (schema.format === 'int64' || schema.format === 'uint64') delete schema.format
  // Formats such as date-time and uuid aren't verified against real responses
  // (Spring's LocalDateTime has no offset), so they're not enforced. Binary stays.
  if (schema.type === 'string' && typeof schema.format === 'string' && schema.format !== 'binary') delete schema.format

  Object.values(schema).forEach(normalizeSchema)

  // Spring serializes missing values as null, but the spec never says a field is nullable.
  const properties = schema.properties as Record<string, unknown> | undefined
  if (properties && typeof properties === 'object') {
    for (const [key, property] of Object.entries(properties)) {
      properties[key] = { anyOf: [property, { type: 'null' }] }
    }
  }
}

// Generates the API contract in app/api/generated from the committed spec snapshot.
// Refresh the snapshot with `pnpm --filter admin api:pull`, then run `api:gen`.
export default defineConfig({
  input: './openapi/syncra.json',
  output: './app/api/generated',
  parser: {
    filters: {
      // Admin only calls the staff endpoints. Keys look like `GET /admin/users/me/profile`.
      operations: { include: ['/^[A-Z]+ \\/admin\\//'] },
    },
    patch: {
      input: spec => normalizeSchema((spec as unknown as SchemaNode).components),
    },
  },
  plugins: [
    '@hey-api/typescript',
    {
      name: 'valibot',
      // Schemas per component only. Request/response schemas are named after the
      // backend's unstable operationIds (`getMyProfile_1`), so they're not generated.
      definitions: true,
      requests: false,
      responses: false,
    },
    // Test-only (decision 0021): an MSW request handler per operation, answering with what the test
    // passes in, typed by the spec. Never imported by app code (lint blocks it). The plugin is "In
    // Progress" upstream, so tests reach it only through test/support/msw.ts, one place to adapt.
    // Not the `@faker-js/faker` plugin: the patch above makes every field nullable, so its fakes
    // are `null` half the time and fail the feature models. Revisit when the spec marks required fields.
    { name: 'msw', source: [] },
  ],
})
