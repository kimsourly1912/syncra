import { fileURLToPath } from 'node:url'

// The API only allows CORS from deployed *.syncra.app origins and scopes its session
// cookies to .syncra.app, so in `nuxt dev` the browser calls this same-origin path and
// Nitro forwards it to NUXT_PUBLIC_API_URL. Not `/api`: Nitro serves /api/_nuxt_icon.
const devApiProxyPath = '/_api'
const apiURL = process.env.NUXT_PUBLIC_API_URL || ''

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/test-utils/module'],
  $development: {
    runtimeConfig: {
      public: {
        apiProxyPath: devApiProxyPath,
        agentTools: true,
      },
    },
    // The WebMCP pilot's `navigate` tool, beside the list tools (docs/agent-tools.md).
    experimental: {
      webmcp: { navigate: true },
    },
    nitro: {
      devProxy: {
        [devApiProxyPath]: {
          target: apiURL,
          changeOrigin: true,
          // The browser's localhost/LAN Origin would fail the API's CORS check.
          headers: { origin: apiURL && new URL(apiURL).origin },
          cookieDomainRewrite: { '*': '' },
        },
      },
    },
  },
  ssr: false,
  devtools: { enabled: true },
  app: {
    head: {
      // English only (no i18n). Screen readers pick their voice and pronunciation from it.
      htmlAttrs: { lang: 'en' },
      title: 'Syncra Admin',
      // Staff only: never in search results (public/robots.txt also disallows every path).
      meta: [{ name: 'robots', content: 'noindex, nofollow' }],
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/img/syncra-logo.png',
        },
      ],
    },
  },
  css: ['@/assets/css/tailwind.css'],
  // Light and dark, light by default: the system setting is ignored until staff pick a mode.
  colorMode: {
    preference: 'light',
    fallback: 'light',
  },
  spaLoadingTemplate: true,
  runtimeConfig: {
    public: {
      // Overridden at runtime by NUXT_PUBLIC_API_URL.
      apiURL,
      apiProxyPath: '',
      // The WebMCP list tools (docs/agent-tools.md). On in `nuxt dev`; NUXT_PUBLIC_AGENT_TOOLS=true elsewhere.
      agentTools: false,
    },
  },
  // Shared test helpers (`fakeApi`), for the tests beside the code they cover (docs/testing.md).
  alias: {
    '#test': fileURLToPath(new URL('./test/support', import.meta.url)),
  },
  devServer: {
    port: 555,
  },
  // WebMCP pilot (docs/agent-tools.md, decision 0017): read-only list tools for an AI agent in a
  // staff member's browser. On here so the composables and their types exist in every build; the
  // tools register only where `runtimeConfig.public.agentTools` is on, and `navigate` only in dev.
  experimental: {
    webmcp: { navigate: false },
    // Typed routes: `router.push`, `<NuxtLink to>`, and `useRoute('<name>')` params are checked
    // against app/pages, so a renamed or mistyped page fails typecheck (decision 0021).
    typedPages: true,
  },
  compatibilityDate: '2025-07-15',
  // Pre-bundle deps Vite would otherwise discover on first visit to a route, which
  // forces a full page reload in `nuxt dev`. Add any new bare import it reports.
  vite: {
    optimizeDeps: {
      include: [
        'valibot',
        '@vueuse/integrations/useSortable',
      ],
    },
  },
  // Typecheck the tests outside app/ too (the app shell and the shared helpers). Relative to .nuxt/.
  typescript: {
    // Type errors in the dev server's problems badge too. `pnpm typecheck` stays the gate.
    typeCheck: 'dev',
    tsConfig: {
      include: ['../test/app-shell/**/*', '../test/support/**/*', '../test/e2e/**/*'],
    },
  },
  eslint: {
    config: {
      stylistic: true,
      formatters: true,
    },
  },
  icon: {
    provider: 'server',
    clientBundle: {
      scan: true,
    },
  },
})
