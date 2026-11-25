import { SESSION_PATHS, redirectTarget, useSession } from '@/features/session'

// Every page is staff-only unless it declares `definePageMeta({ access: 'guest' })`.
// This is navigation, not security: the API checks the session on every request.
export default defineNuxtRouteMiddleware(async (to) => {
  const session = useSession()
  const failure = await session.load()

  // The API couldn't say whether there's a session (offline, 5xx). Don't send a staff member
  // with valid cookies to sign-in: show the error page, whose "Try again" repeats this navigation.
  if (failure) {
    return createError({
      status: 503,
      statusText: 'Syncra Admin is unavailable',
      message: failure.message,
      data: { retry: to.fullPath },
      fatal: true,
    })
  }

  const access = to.meta.access ?? 'staff'
  if (access === 'staff' && !session.signedIn.value) {
    return navigateTo({ path: SESSION_PATHS.signIn, query: to.fullPath === SESSION_PATHS.home ? {} : { redirect: to.fullPath } })
  }
  if (access === 'guest' && session.signedIn.value) {
    return navigateTo(redirectTarget(to.query.redirect))
  }
})
