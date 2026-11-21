import tailwindcss from '@tailwindcss/vite'
import { iconOptions } from './config/icon'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n', '@nuxt/icon', '@nuxt/image', '@nuxt/eslint', '@nuxt/test-utils/module', '@nuxt/ui'],
  ssr: false,
  components: [
    {
      path: '~/components',
      pathPrefix: false, // remove prefix from directory
    },
  ],
  imports: {
    dirs: ['constants'], // auto import
  },
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Syncra',
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
  runtimeConfig: {
    public: {
      apiURL: process.env.NUXT_PUBLIC_API_URL || '',
      webURL: process.env.NUXT_PUBLIC_WEB_URL || '',
      portalURL: process.env.NUXT_PUBLIC_PORTAL_URL || '',
      awsS3Url: process.env.NUXT_PUBLIC_AWS_S3_URL || '',
    },
  },
  devServer: {
    host: '',
    port: 333,
  },
  compatibilityDate: '2025-07-15',
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  eslint: {
    config: {
      stylistic: true,
      formatters: {
        html: 'prettier',
      },
    },
  },
  i18n: {
    defaultLocale: 'en',
    strategy: 'no_prefix',
    /**
     * automatically read from directory i18n/locales/*.json
     */
    locales: [
      {
        code: 'en',
        language: 'en-US',
        file: 'en-US.json',
      },
      // {
      //   code: 'zh',
      //   language: 'zh-CN',
      //   file: 'zh-CN.json',
      // },
    ],
    experimental: {
      /**
       * auto generate to .nuxt/types/i18n-messages.d.ts
       */
      typedOptionsAndMessages: 'all',
    },
  },
  icon: iconOptions,
})
