# Admin forms

Admin forms use the same rules as the shared [form conventions](../../../docs/conventions.md#forms). The working reference is `pages/auth/sign-in.vue` with `features/auth/composables/useSignIn.ts`.

## Pattern

```vue
<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { SchemaToString } from '@/types/common'
import { signInSchema } from '@/schema/auth.schema'
import type { ISignInSchema } from '@/schema/auth.schema'
import { useSignIn } from '@/features/auth'

const { pending, submit } = useSignIn()

const data = reactive<ISignInSchema>({ email: '', password: '' })
const FIELD_NAME = { email: 'email', password: 'password' } satisfies SchemaToString<ISignInSchema>

function onSubmit(evt: FormSubmitEvent<ISignInSchema>) {
  return submit(evt.data)
}
</script>
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
| Schema + `I<Name>Schema` type | `app/features/<feature>/schemas/<name>-form.ts` (new). `app/schema/` holds the existing auth and base schemas. |
| Field building blocks | `app/schema/base.schema.ts` |
| Form → request mapping | A pure function next to the schema |
| Submit action | The feature composable |

## Inputs

| Need | Use |
| --- | --- |
| Password with strength hints | `<InputPassword>` + `<FormPasswordSuggestion>`, using the rules in `app/utils/validate.ts` |
| Upload (workbook or image) | `UFileUpload` or a file input. Validate type and size on the client, and always show the server's verdict. |
| Attestation | `UCheckbox`. Reset it when the thing being attested changes (`confirmed.value = false` in the review detail). |

## Rules

- Disable the fields and the submit button while `pending` is true. Keep the form open until the request finishes.
- Show the API reason with `toast.failed` or `toast.exception`, and keep the input as entered.
- Pages with Save and Cancel in a `LayoutHeading #suffix` (products, plans) put the form outside `UForm`'s submit button. Bind Save to the form with a template ref, or move the button inside the form. Don't leave Save unconnected, as the current shells do.
