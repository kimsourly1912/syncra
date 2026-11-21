import { routeRules } from './app/constants/route'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxt/ui'],
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
  css: ['~/assets/css/tailwind.css'],
  ui: {
    colorMode: false,
  },
  spaLoadingTemplate: true,
  runtimeConfig: {
    public: {
      imageURL: process.env.NUXT_PUBLIC_IMAGE_URL || '',
      apiURL: process.env.PROXY_API_PATH || process.env.NUXT_PUBLIC_API_URL || '',
    },
  },
  routeRules,
  devServer: {
    host: '',
    port: 555,
  },
  compatibilityDate: '2025-07-15',
  nitro: {
    devProxy: process.env.PROXY_API_PATH
      ? {
          [process.env.PROXY_API_PATH]: {
            changeOrigin: true,
            cookieDomainRewrite: { '.syncra.app': '' },
            target: process.env.PROXY_API_TARGET || process.env.NUXT_PUBLIC_API_URL,
          },
        }
      : undefined,
  },
  eslint: {
    config: {
      stylistic: true,
      formatters: true,
    },
  },
  icon: {
    provider: 'server',
    customCollections: [
      {
        prefix: 'app',
        dir: './app/assets/icons/app',
      },
    ],
  },
})
