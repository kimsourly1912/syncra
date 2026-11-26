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
      },
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
      title: 'Syncra Admin',
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
    },
  },
  // Shared test helpers (`fakeApi`), for the tests beside the code they cover (docs/testing.md).
  alias: {
    '#test': fileURLToPath(new URL('./test/support', import.meta.url)),
  },
  devServer: {
    port: 555,
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
