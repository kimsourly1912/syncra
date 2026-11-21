declare module '#app' {
  interface PageMeta {
    /** Who may open the page. Default `staff`; `guest` for the sign-in pages. See middleware/access.global.ts. */
    access?: 'staff' | 'guest'
  }
}

export {}
