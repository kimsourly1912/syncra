# Admin forms

Admin forms use the same rules as the shared [form conventions](../../../docs/conventions.md#forms). The working reference is `pages/auth/sign-in.vue` with `features/auth/composables/useSignIn.ts`.

## Pattern

```vue
<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { signInSchema, useSignIn } from '@/features/auth'
import type { ISignInSchema } from '@/features/auth'

const { pending, submit } = useSignIn()

const data = reactive<ISignInSchema>({ email: '', password: '' })
const FIELD_NAME = { email: 'email', password: 'password' } satisfies { [K in keyof ISignInSchema]: K }

function onSubmit(evt: FormSubmitEvent<ISignInSchema>) {
  return submit(evt.data)
}
</script>
```

```ts
// features/auth/schemas/sign-in-form.ts: fields start from the generated request schema
const { email, password } = vSuperAdminLoginRequest.entries

export const signInSchema = v.object({
  email: v.pipe(v.nonNullish(email), v.nonEmpty('This field is required'), v.email('Invalid email')),
  password: v.pipe(v.nonNullish(password), v.nonEmpty('This field is required')),
})
```

```ts
// features/auth/composables/useSignIn.ts (excerpt)
const signIn = useApiMutation(
  (form: ISignInSchema) => session.signIn({ email: form.email, password: form.password }),   // maps form → request body
  { success: 'Welcome to Syncra', error: 'Could not sign in' },                              // toasts, both ways
)

async function submit(form: ISignInSchema) {
  const result = await signIn.execute(form)   // never throws
  if (result.ok) await router.push(redirectTarget(route.query.redirect))
  return result.ok
}
// returns { pending: signIn.pending, submit }
```

## Where the pieces go

| Piece | Location |
| --- | --- |
| Schema + `I<Name>Schema` type | `app/features/<feature>/schemas/<name>-form.ts`. Start each field from the generated request schema (`v<Request>.entries.<field>` in `v.nonNullish`), then add the form rules as Valibot actions. Don't add regex constants or a shared base schema. |
| Form → request mapping | A pure function next to the schema |
| Submit action | The feature composable |

## Inputs

| Need | Use |
| --- | --- |
| Password with strength hints | `<InputPassword>` + `<PasswordSuggestion>` from `@/features/auth`. The rules are Valibot schemas in `features/auth/schemas/reset-password-form.ts`, shared by the checklist and `resetPasswordSchema`. |
| Upload (workbook or image) | `UFileUpload` or a file input. Validate type and size on the client, and always show the server's verdict. |
| Attestation | `UCheckbox`. Reset it when the thing being attested changes (`confirmed.value = false` in the review detail). |

## Rules

- Validate on submit only: every `UForm` sets `:validate-on="[]"` (lint enforces it). No errors on blur, input, or change ([conventions → forms](../../../docs/conventions.md#forms)).
- Disable the fields and the submit button while `pending` is true. Keep the form open until the request finishes.
- On failure `useApiMutation` already toasts the API's reason; keep the input as entered. Use `useAppToast().failed(text)` only for a failure the composable decides itself.
- Pages with Save and Cancel in the `UDashboardNavbar #right` slot (products, plans) put the form outside `UForm`'s submit button. Bind Save to the form with a template ref, or move the button inside the form. Never leave Save enabled but unconnected. Until a form's API exists, disable it and say why, as `ProductFormScreen` and `PlanFormScreen` do.
