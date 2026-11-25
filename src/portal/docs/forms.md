# Portal forms

Forms use Nuxt UI `UForm` and `UFormField` with a Valibot schema. The shared schema and naming rules are in [conventions → forms](../../../docs/conventions.md#forms). How a submit calls the API is in [data access → writes](data-access.md#writes).

## Where the pieces go

| Piece | New feature | Existing code |
| --- | --- | --- |
| Valibot schema + inferred type | `app/features/<feature>/schemas/<name>-form.ts` | `app/schema/<resource>.schema.ts` |
| Form → request mapping | Same file as the schema: `to<Name>Req(data)` | Usually inline in the page |
| Form component | `app/features/<feature>/components/<Name>Form.vue` or `<Name>FormModal.vue` | Pages and `app/components/form/` |
| Submit action | `use<Feature>()` composable | `xxxProps()` factories in pages (legacy) |
| Reusable field rules | `baseSchema` in `app/schema/base.schema.ts` | — |

Reuse an existing schema in `app/schema/` when it already covers the form. Don't duplicate it inside a feature.

## Schema

```ts
// app/features/team-management/schemas/invite-member-form.ts
import * as v from 'valibot'
import { baseSchema } from '@/schema/base.schema'
import type { TeamManagementDTO } from '@/types/dto'

export const inviteMemberSchema = v.object({
  email: baseSchema.email,
  jobTitle: baseSchema.string,
})

export type IInviteMemberSchema = v.InferOutput<typeof inviteMemberSchema>
```

The building blocks in `baseSchema` are `string` (required, with the message "This field is required"), `email`, `phone` (digits), `file` (image type and size limit), `password` (8+ characters), `awsPassword` (the sign-up strength rule), `otp`, `array`, `boolean`, and `true`. Each has an `optional.*` variant.

For a rule that spans fields, use `v.pipe(v.object(...), v.forward(v.partialCheck(...), ['field']))`, so the error shows on one field. `changePasswordSchema` in `app/schema/profile.schema.ts` shows this.

## Map the form to the request

Form shape and API shape differ: a phone code and number are separate fields, and optional fields need defaults. Keep the mapping in a pure function, and unit-test it when it does more than copy fields:

```ts
export function toInvitationReq(data: IInviteMemberSchema, roleId: number): TeamManagementDTO.TeamInvitationReq {
  return { email: data.email.trim(), jobTitle: data.jobTitle, roleId }
}
```

`TeamInvitationReq` really has these fields (`email`, `roleId`, `jobTitle`). The role ID comes from the roles API (`role.service.ts`), never from user input.

## Component

```vue
<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { SchemaToString } from '@/types/common'
import type { TeamManagementDTO } from '@/types/dto'
import { inviteMemberSchema, toInvitationReq } from '../schemas/invite-member-form'
import type { IInviteMemberSchema } from '../schemas/invite-member-form'

const props = defineProps<{ pending: boolean, roleId: number }>()
const emit = defineEmits<{ submit: [req: TeamManagementDTO.TeamInvitationReq] }>()

const state = reactive<IInviteMemberSchema>({ email: '', jobTitle: '' })

const FIELD_NAME = {
  email: 'email',
  jobTitle: 'jobTitle',
} satisfies SchemaToString<IInviteMemberSchema>

function onSubmit(event: FormSubmitEvent<IInviteMemberSchema>) {
  emit('submit', toInvitationReq(event.data, props.roleId))
}
</script>

<template>
  <UForm :state :schema="inviteMemberSchema" class="space-y-6" :validate-on="[]" @submit="onSubmit">
    <UFormField label="Email address" :name="FIELD_NAME.email" required>
      <UInput v-model="state.email" type="email" class="w-full" :disabled="pending" />
    </UFormField>
    <UFormField label="Job title" :name="FIELD_NAME.jobTitle" required>
      <UInput v-model="state.jobTitle" class="w-full" :disabled="pending" />
    </UFormField>
    <UButton type="submit" label="Send invitation" :loading="pending" block />
  </UForm>
</template>
```

Rules:

- **Field names.** `FIELD_NAME ... satisfies SchemaToString<ISchema>` checks that each value equals its key, so a typo fails the type check. Some older forms use `ObjectValueToString`, which only checks that values are strings. Prefer `SchemaToString`.
- **State.** Hold form state in `reactive<ISchema>()`, with every field initialized. Reset it after a successful submit, or when the modal closes.
- **Validation.** `UForm` validates against the schema before `@submit`. Don't repeat those checks in the handler.
- **Validate on submit only.** Set `:validate-on="[]"` on every `UForm`, so errors don't appear while the user is still filling the form in ([conventions → forms](../../../docs/conventions.md#forms)).
- **Pending.** The parent passes `pending` in. Inputs and Submit are disabled or loading while it's true.
- **Server errors.** Show the API's `reason` in a toast, and keep the input as entered. The API doesn't currently return errors per field, so don't invent a mapping.
- **One form per independent save.** Profile details and password are separate forms on Account Profile. Representative and company details are separate on Company Information.

## Special inputs

| Need | Use |
| --- | --- |
| Password with the strength hint | `<InputPassword>` + `<PasswordSuggestionMessage>`. The rules are in `app/utils/validate.ts` (`validatePasswordDetailed`, `getPasswordValidationMessages`). |
| Phone with country code | `<InputPhoneNumber>`, with separate `phone` and `phoneCode` models. Combine them in the request mapping. |
| Date range filter | `<DateRangePicker>` (`v-model` of `{ start, end }`) |
| Image upload with preview | `UFileUpload` + `useObjectUrl` (see Account Profile). Limits are `ACCEPTED_IMAGE_TYPES` and `MAX_IMAGE_SIZE` in `app/constants/app.ts`. |
| Searchable select that can create options | `USelectMenu` with `create-item` (the job title picker on Team Management and Account Profile) |
| One-time code | `<VerifyCode>` (auth flows) |
