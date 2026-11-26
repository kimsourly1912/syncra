/**
 * Where Admin sends an error the team needs to see: a response that broke its model (the API
 * changed shape), an unknown failure, or an error nothing caught. Until a reporting service is
 * chosen (open question), it logs to the console, so it's only visible in the staff member's
 * browser. Connect the service in one place with `setErrorReporter`.
 *
 * Never put credentials or customer documents in `context`.
 */
export interface ErrorContext {
  /** What failed, e.g. `GET /admin/users/me/profile` or `vue:error`. */
  source?: string
  /** A short description of what was happening. */
  message?: string
}

type Reporter = (error: unknown, context: ErrorContext) => void

const toConsole: Reporter = (error, context) => console.error(context.message ?? '[Syncra Admin] Unexpected error', error)

let reporter: Reporter = toConsole

/** Replaces the console reporter; `undefined` restores it. Call once, from a plugin. */
export function setErrorReporter(next: Reporter | undefined) {
  reporter = next ?? toConsole
}

/** Reports an error for the team. Never throws, so a reporting failure can't break the screen. */
export function reportAppError(error: unknown, context: ErrorContext = {}) {
  try {
    reporter(error, context)
  }
  catch (failure) {
    console.error('[Syncra Admin] Could not report an error', failure, error)
  }
}
