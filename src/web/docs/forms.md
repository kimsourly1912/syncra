# Web forms

Web's only form is the Contact Sales inquiry. Follow the shared [form conventions](../../../docs/conventions.md#forms).

| Piece | File |
| --- | --- |
| Schema and `IContactSaleSchema` | `app/schema/contact-sale.schema.ts`, built on `app/schema/base.schema.ts` |
| Form UI | `app/components/form/FormContactSale.vue`: `v-model:data`, `pending` prop, emits `submit` with the validated event |
| Modal wrapper | `app/components/modal/ModalContactSale.vue` (`v-model`) |
| State, mapping, submit | `app/composables/useContactSale.ts` |
| Phone input | `app/components/base/InputPhoneNumber.vue`, with codes from `assets/data/data.ts` (`phoneCodes`) |
| Option lists | `assets/data/*.json` (countries, company sizes, industries) |

## Rules

- Validate on submit only: the `UForm` sets `:validate-on="[]"`, so no errors appear on blur, input, or change ([conventions → forms](../../../docs/conventions.md#forms)).
- The form component validates and emits. It doesn't call the API. The composable maps and submits.
- `FIELD_NAME` uses `satisfies ObjectValueToString<IContactSaleSchema>`. Web doesn't define `SchemaToString`. If you add it, copy Portal's definition into `app/types/common.ts`.
- Preselect the product when the form opens from a product page (`data.modules = [slug]`), as `products/[slug].vue` does.
- Show the success dialog only after a confirmed success. Keep the input when the submit fails ([data access](data-access.md#the-contact-sales-write)).
- Collect only what sales needs. Don't add fields for sensitive personal data.
