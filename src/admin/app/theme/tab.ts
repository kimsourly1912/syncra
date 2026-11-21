import type { TabsProps } from '@nuxt/ui'

export const tabTheme: TabsProps['ui'] = {
  trigger: 'px-6 inline-flex min-w-auto',
  content: 'md:p-6 p-4 space-y-5',
  indicator: 'border-2 border-primary',
  root: 'rounded-lg bg-white ring ring-default',
  list: 'px-4 py-2 overflow-y-hidden overflow-x-auto',
  label: 'text-base md:text-lg font-normal cursor-pointer text-clip whitespace-nowrap',
}
