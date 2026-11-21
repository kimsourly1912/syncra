import tailwindcss from '@tailwindcss/vite'
import type { NitroRouteConfig } from 'nitropack/types'
import { privatePathValue } from './app/constants/route'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/i18n',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],
  ssr: false,
  components: [
    {
      path: '~/components',
      pathPrefix: false, // remove directory prefix
    },
  ],
  imports: {
    dirs: [''], // auto import
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
  colorMode: {
    preference: 'light',
  },
  spaLoadingTemplate: true,
  runtimeConfig: {
    public: {
      apiURL: process.env.PROXY_API_PATH || process.env.NUXT_PUBLIC_API_URL || '',
      imageURL: process.env.NUXT_PUBLIC_IMAGE_URL || '',
      hideSocialLogin: process.env.NUXT_PUBLIC_HIDE_SOCIAL_LOGIN === 'true',
      hidePhoneSignUp: process.env.NUXT_PUBLIC_HIDE_PHONE_SIGN_UP === 'true',
    },
  },
  routeRules: {
    '/auth/**': {
      appMiddleware: 'guest',
      appLayout: 'auth',
    },
    '/policy/**': {
      appLayout: 'blank',
    },
    ...privatePathValue.reduce((acc, item) => {
      const isOnboarding = item.includes('/onboarding')
      acc[item] = {
        appMiddleware: isOnboarding ? 'onboarding' : 'auth',
        appLayout: isOnboarding ? 'blank' : 'default',
      }
      return acc
    }, {} as Record<string, NitroRouteConfig>),
  },
  devServer: {
    host: '',
    port: 444,
  },
  experimental: {
    typedPages: true,
  },
  compatibilityDate: '2025-07-15',
  nitro: {
    devProxy: process.env.PROXY_API_PATH
      ? {
          [process.env.PROXY_API_PATH]: {
            target: process.env.PROXY_API_TARGET || process.env.NUXT_PUBLIC_API_URL,
            changeOrigin: true,
            cookieDomainRewrite: { '.syncra.app': '' },
          },
        }
      : undefined,
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  eslint: {
    config: {
      stylistic: true,
      formatters: true,
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
      {
        code: 'zh',
        language: 'zh-CN',
        file: 'zh-CN.json',
      },
    ],
    experimental: {
      /**
       * auto generate to .nuxt/types/i18n-messages.d.ts
       */
      typedOptionsAndMessages: 'all',
    },
  },
  icon: {
    provider: 'server',
    // clientBundle: {
    //   scan: true,
    //   includeCustomCollections: true,
    //   icons: ['lucide'],
    // },
    customCollections: [
      {
        prefix: 'app',
        dir: './app/assets/icons/app',
      },
      {
        prefix: 'flag',
        dir: './app/assets/icons/flag',
      },
      {
        prefix: 'logo',
        dir: './app/assets/icons/logo',
      },
      // {
      //   prefix: 'lucide',
      //   dir: './app/assets/icons/lucide',
      // },
      {
        prefix: 'fluent',
        dir: './app/assets/icons/fluent',
      },
    ],
  },
  image: {
    domains: [process.env.NUXT_PUBLIC_IMAGE_URL!],
    screens: {
      xs: 80,
    },
  },
  vueuse: {
    autoImports: false,
  },
})
