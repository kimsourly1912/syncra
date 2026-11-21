# Web testing and verification

Web has Vitest configured (`vitest.config.ts`), with a `unit` project (`test/unit`, node) and a `nuxt` project. The only test is `test/unit/sum.test.ts`, a placeholder that **fails**: it asserts `sum(1, 1)` is `4`. Report it as a known failure. Don't count it as a regression from your change. Replacing it is its own change.

## Commands

Run from the repository root:

```bash
pnpm --filter @syncra/web lint
```

```bash
pnpm --filter @syncra/web build
```

```bash
pnpm --filter @syncra/web test:unit --run
```

```bash
pnpm --filter @syncra/web test:nuxt --run
```

## What to test

| Change | Test |
| --- | --- |
| A form → request mapping (Contact Sales) | `unit`: pull the mapping out as a pure function and test the phone join and field mapping |
| The submit flow | `nuxt`: mock `createContactSale` and check that the success dialog opens only for `success: true`, and that a thrown error or `success: false` keeps the form open |
| Route-driven reads | `nuxt`: changing the slug loads new content. Use Portal's [mocking patterns](../../portal/docs/testing.md#mocking-patterns). |

Fixtures use made-up names and emails (`buyer@example.com`). Never use real lead data.

## Browser verification

- Run `pnpm dev:web` and open `http://localhost:333`.
- Check from the normal navigation: Home → Products → a product → another product → About.
- Also open a page by its URL directly.
- Check phone and desktop widths.
- Contact Sales sends a real inquiry when the API is live. Submit it only against a test API, and report whether delivery was live or mocked.
