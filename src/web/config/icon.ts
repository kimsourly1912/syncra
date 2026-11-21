import type { ModuleOptions } from '@nuxt/icon'

const customCollections: ModuleOptions['customCollections'] = [
  {
    prefix: 'app',
    dir: './app/assets/icons/app',
  }, {
    prefix: 'flag',
    dir: './app/assets/icons/flag',
  }, {
    prefix: 'logo',
    dir: './app/assets/icons/logo',
  }, {
    prefix: 'lucide',
    dir: './app/assets/icons/lucide',
  },
]

export const iconOptions: ModuleOptions = {
  provider: 'none',
  clientBundle: {
    scan: false,
    includeCustomCollections: true,
  },
  customCollections,
}
