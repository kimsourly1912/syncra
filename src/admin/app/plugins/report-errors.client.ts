import { ApiError } from '@/api'

// Errors nothing caught (a render error, a rejected promise in a handler) go to `reportAppError`
// (utils/report.ts), the same place as broken API responses. A cancelled request or an ended
// session is expected, so it isn't reported.
export default defineNuxtPlugin({
  name: 'report-errors',
  setup(nuxtApp) {
    const report = (error: unknown, source: string) => {
      if (error instanceof ApiError && error.silent) return
      reportAppError(error, { source })
    }

    nuxtApp.hook('vue:error', error => report(error, 'vue:error'))
    nuxtApp.hook('app:error', error => report(error, 'app:error'))
    window.addEventListener('unhandledrejection', event => report(event.reason, 'unhandledrejection'))
  },
})
