export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',
    },
  },
  icon: {
    /**
     * due to the default style of this icon is set to global layer
     * so it takes precedence over tailwind classes.
     * and we can't easily change its style like width or height,
     * luckily we have `cssLayer` that we can be injected icon style into
     * tailwind layer so our life is secure
     */
    cssLayer: 'components',
  },
})
