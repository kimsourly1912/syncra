export default defineAppConfig({
  ui: {
    icons: {
      chevronDown: 'lucide:chevron-down',
      chevronUp: 'lucide:chevron-up',
      light: 'lucide:sun',
      dark: 'lucide:moon',
      system: 'lucide:monitor',
      menu: 'lucide:menu',
      arrowLeft: 'lucide:arrow-left',
      eye: 'lucide:eye',
      eyeOff: 'lucide:eye-off',
      search: 'lucide:search',
      panelClose: 'lucide:panel-left-close',
      panelOpen: 'lucide:panel-left-open',
      check: 'lucide:check',
    },
    modal: {
      slots: {
        overlay: 'bg-black/60 dark:bg-elevated/75',
      },
    },
    colors: {
      primary: 'brand',
    },

  },
  icon: {
    /**
     * by default the custom icons style is set on the top level layer of css
     * so we can't easily change its size by
     * luckily we have a prop to change the order of css layer
     */
    cssLayer: 'components',
  },
})
