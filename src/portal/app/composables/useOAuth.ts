import type { BaseDTO } from '@/types/dto'
import * as authServices from '@/services/auth.service'
import type { AuthSocialMediaItem } from '~/components/form/SocialMediaItem.vue'

export function useOAuth() {
  const { toast } = useAppToast()
  const asyncDataApple = useAsyncData(byApple, { immediate: false })
  const asyncDataGoogle = useAsyncData(byGoogle, { immediate: false })
  const asyncDataFacebook = useAsyncData(byFacebook, { immediate: false })

  const oAuthItems = computed<AuthSocialMediaItem[]>(() => [
    {
      label: 'Continue with Google',
      icon: 'logo:google-colorful',
      loading: asyncDataGoogle.pending.value,
      onClick: () => asyncDataGoogle.execute(),
    },
    {
      label: 'Continue with Apple',
      icon: 'logo:apple',
      loading: asyncDataApple.pending.value,
      onClick: () => asyncDataApple.execute(),
    },
    {
      label: 'Continue with Facebook',
      icon: 'logo:facebook-colorful',
      loading: asyncDataFacebook.pending.value,
      onClick: () => asyncDataFacebook.execute(),
    },
  ])

  function errorToast(description: string) {
    toast.add('error', { title: 'Failed', description })
  }

  async function onExecute<T>(fn: () => Promise<T>) {
    // Check if mobile iOS Safari (popups don't work properly)
    const ua = navigator.userAgent
    const platform = navigator.platform
    const maxTouch = navigator.maxTouchPoints || 0
    const isIPhoneIPod = /iP(hone|od)/.test(ua)
    const isIPad = /iPad/.test(ua) || (platform === 'MacIntel' && maxTouch > 1)
    const isMobileIOS = isIPhoneIPod || isIPad

    if (isMobileIOS) {
      // Mobile iOS: Get URL first, then redirect current page
      try {
        const { data, success, reason } = await fn() as BaseDTO.BaseRes<string>
        if (success) {
          window.location.href = data
        }
        else {
          errorToast(reason)
        }
      }
      catch (e) {
        toast.addException(e)
      }
      return
    }

    // Desktop browsers: Open popup with about:blank FIRST to preserve window.opener
    // Opening directly to cross-origin OAuth URL causes browsers to null out window.opener
    const popup = window.open(
      'about:blank',
      'oauth-popup',
      'width=960, height=600, toolbar=no, location=no, status=no, menubar=no, scrollbars=no, resizable=no',
    )

    try {
      const { data, success, reason } = await fn() as BaseDTO.BaseRes<string>

      if (success) {
        if (popup) {
          popup.location.href = data
        }
        else {
          // Popup was blocked, fall back to redirect
          window.location.href = data
        }
      }
      else {
        popup?.close()
        errorToast(reason)
      }
    }
    catch (e) {
      popup?.close()
      toast.addException(e)
    }
  }

  function byGoogle() {
    return onExecute(authServices.oAuthGoogle)
  }

  function byFacebook() {
    return onExecute(authServices.oAuthFacebook)
  }

  function byApple() {
    return onExecute(authServices.oAuthApple)
  }

  return {
    oAuthItems,
    asyncDataGoogle,
    asyncDataFacebook,
    byApple,
    byGoogle,
    byFacebook,
  }
}
