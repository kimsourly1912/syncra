export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',
      info: 'cyan',
      secondary: 'neutral',
      neutral: 'neutral',
    },
    button: {
      defaultVariants: {
        size: 'lg',
      },
    },
    input: {
      defaultVariants: {
        size: 'lg',
      },
    },
    select: {
      defaultVariants: {
        size: 'lg',
      },
    },
    badge: {
      defaultVariants: {
        size: 'lg',
      },
    },
    switch: {
      defaultVariants: {
        size: 'lg',
      },
    },
  },
  icon: {
    mode: 'css',
    cssLayer: 'base',
  },
})
