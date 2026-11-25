# Web UI

Web is a public marketing site. Visitors arrive on any device, often from a link straight to one page.

## Foundation

- **Colors.** `primary` is the `brand` palette (`app/assets/css/tailwind.css`, `app/app.config.ts`). Use semantic utilities (`text-highlighted`, `text-muted`, `bg-default`, `ring-accented`). The decorative glow in `LayoutDefault` also uses `bg-teal-500`.
- **No color mode.** `ui.colorMode` is `false`, so the site is light only.
- **Icons.** `config/icon.ts` uses `provider: 'none'` with local collections: `app`, `flag`, `logo`, and `lucide` from `app/assets/icons/<prefix>/`. **A Lucide icon must exist as a local SVG** in `app/assets/icons/lucide/`. Add the SVG before using a new `lucide:*` name. The `generate:icon` script (`scripts/icon.ts`) is referenced in `package.json`, but its file isn't in this checkout.
- **Modal overlay.** It's configured globally (`bg-black/60`). Don't override it per modal.
- **Class strings in TypeScript** use `tw\`…\``.

## Page anatomy

```vue
<script setup lang="ts">
useHead({ titleTemplate: 'Products - %s' })
</script>

<template>
  <LayoutDefault>                  <!-- UMain + centered container; props: size '5xl'|'6xl'|'7xl'(default)|'full', glow (default true) -->
    <h1 class="text-4xl font-semibold text-center text-highlighted">Syncra Modules</h1>
    <!-- sections -->
  </LayoutDefault>
</template>
```

`layouts/default.vue` provides the header (Products, Community, Download, and Portal links) and the footer. Pages provide only their content inside `LayoutDefault`.

## Patterns

| Pattern | Reference | Notes |
| --- | --- | --- |
| Hero / landing | `pages/index.vue` | Large heading, calls to action (Contact Sales, pricing), media (`VideoPlayer`) |
| Card grid | `pages/products/index.vue` | `grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10` with ring cards |
| Content detail | `pages/products/[slug].vue` | Cover image, `UCard` body, Contact Sales action |
| Legal text | `pages/privacy-policy.vue`, `pages/terms-of-use.vue` | Static content plus `useHead` |
| Inquiry | `ModalContactSale` + `FormContactSale` | Opened from several pages, with `ModalSuccess` after a confirmed submit |

## Required states

| State | Show |
| --- | --- |
| Loading API content | A skeleton or placeholder that keeps the layout. Don't leave an empty section. |
| Missing content (bad slug, API down) | A fallback message with a link back to the listing |
| Submitting | `:loading` on Submit, fields disabled |
| Submit failed | A toast with the reason. The form stays open with its input. |
| Submit succeeded | `ModalSuccess`, shown only after a confirmed `success: true` |

## Localization

Only `en` is enabled in `nuxt.config.ts`. `i18n/locales/zh-CN.json` exists, but its locale is commented out. Pages are hardcoded English. Write new copy in English. Don't add `t()` keys unless the screen already uses them, or the change enables Chinese for the whole site.

## Review checklist

- [ ] The page has a `useHead` title.
- [ ] It works at 375px, 768px, and 1280px+, with no horizontal scroll and readable line lengths.
- [ ] A direct visit works, and so does navigating there from another page (for detail pages, product A → product B).
- [ ] Images have `alt` text, and icon-only buttons have an `aria-label`.
- [ ] Every new `lucide:*` icon exists in `app/assets/icons/lucide/`.
- [ ] Portal links use `useURL().toPortal`.
- [ ] Every `UForm` sets `:validate-on="[]"`. Leaving a field empty and tabbing away shows no error; pressing Submit does ([forms](forms.md)).
