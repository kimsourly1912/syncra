declare module '#app' {
  interface PageMeta {
    /** Who may open the page. Default `staff`; `guest` for the sign-in pages. See middleware/access.global.ts. */
    access?: 'staff' | 'guest'
    /**
     * The page's name, in sentence case: the browser tab ("Lead inquiries · Syncra Admin", app.vue)
     * and its sidebar link (layouts/default.vue) both read it, so the two can't drift apart.
     */
    title?: string
  }
}

export {}
