# 0007: Admin generates its API contract from the OpenAPI spec and parses responses into feature models

- Status: Accepted. Admin only. All Admin services migrated; `types/dto/` removed. Point 4 changed by [0008](0008-admin-api-client-and-session.md): services pass a `model`, and the client parses the envelope.
- Date: 2026-11-21
- Scope: Admin. Portal and Web keep hand-written DTOs until they adopt this.

## Context

Admin typed its requests with hand-written DTOs in `types/dto/`. They had already drifted from the API: the spec's `ReviewItem` has `reviewedByProfileId`, and the DTO didn't.

The API publishes an OpenAPI 3.1 spec (springdoc) at `<NUXT_PUBLIC_API_URL>/v3/api-docs`. It has 70 `/admin` operations, but it describes the responses poorly:

- Only 24 of 330 schemas declare `required`, so every generated field is optional.
- No field is marked nullable, but the API sends `null` (the old DTOs had `draftUuid: string | null`).
- No error responses are documented.
- Operation IDs are unstable (`getMyProfile_1`, `list_3`).

We can't get the backend changed, so the frontend has to protect itself.

## Decision

1. **Generated contract.** `@hey-api/openapi-ts` (pinned exactly) generates `app/api/generated/` from the committed snapshot `openapi/syncra.json`. It's limited to `/admin/**` and runs the `@hey-api/typescript` and `valibot` (definitions only) plugins. Nobody edits generated files. Builds never fetch the spec.
2. **Spec patches** in `openapi-ts.config.ts` make the contract match the JSON the browser receives:
   - every property accepts `null`
   - `int64` stays a JS `number`, not `BigInt`
   - string formats such as `date-time` and `uuid` aren't enforced, because they haven't been verified against real responses
3. **Feature models.** Code outside services doesn't use generated types directly. Each feature defines models with `defineModel(vX, { required, optional })` in `features/<f>/models/`:
   - **required** fields must be present and not null
   - **optional** fields pass through
   - undeclared fields are dropped
4. **Parsing in the service.** `features/<f>/services/` (or `app/services/session.service.ts`, for the calls shared code needs) parse responses with `parseEnvelope` (for `ResponseMsg*`) or `parseData` (for bare bodies). A mismatch throws `ApiContractError`, which takes the existing thrown-error path ([0003](0003-request-and-error-flow.md)), and `toast.exception` shows it.
5. **Lists fail as a whole.** If one item fails its model, the whole response fails. Rows are never dropped silently.
6. **Naming.** "API types" and "API schemas" are generated. "Models" belong to features. The `DTO` term, the `XxxDTO` namespaces, and the `Param`/`Query`/`Req`/`Res` suffixes are not used in new Admin code.

## Alternatives

- **Keep hand-written DTOs.** They drift silently, which has already happened.
- **Generate a full client (Hey API SDK, nuxt-open-fetch, openapi-fetch).** Its function names would come from the unstable operation IDs. It would also replace `useAPI`'s 401 refresh and retry, and it still couldn't fix the missing `required` fields.
- **openapi-typescript.** Types only, with no Valibot output. Its peer dependency is `typescript ^5`, and Admin uses 6.
- **Post-process the contract to make every field required.** That guesses backend behavior, which the root rules forbid.
- **Use Valibot's `v.required`.** It still accepts `null` for `nullish` fields, so `defineModel` uses `v.nonNullish`.

## Consequences

- A backend change shows up as a diff of `openapi/syncra.json` and the generated files. Lint and build checks then catch code that no longer fits.
- A missing or null required field becomes a visible error that names the endpoint and the field, instead of a blank or wrong screen.
- Each model documents what its feature depends on from the API.
- Migrated:
  - auth (`features/auth`)
  - the session (`app/services/session.service.ts`, `app/models/staff-profile.ts`)
  - TechPack review (`features/techpack-review`)

  `types/dto/` is gone.
- **Where the spec is wrong, a model may add a field.** Do this only when working code is the evidence, and say so in a comment and an open question. The case so far: `pdfValue` on PDF findings, which the spec loses because springdoc collapses two backend classes named `Finding` into one schema.
- TechPack review's screen logic has moved into `useReviewQueue` and `useReviewDetail`, with `ReviewQueueScreen` and `ReviewDetailScreen`. Its route files are thin.
