import { api } from '@/api'
import { staffProfileModel, useSession } from '@/features/session'
import type { IProfileSchema } from '../schemas/profile-form'

/**
 * The signed-in staff member's own profile: the display name and the logo. The profile itself is
 * the session's (loaded at sign-in); after a change the session reloads it, so the staff menu in
 * the sidebar shows the change too.
 */
export function useProfileSettings() {
  const session = useSession()

  const refreshSession = async (ok: boolean) => {
    if (ok) await session.reload()
    return ok
  }

  const rename = useApiMutation(
    (form: IProfileSchema) => api.post('/admin/users/me/profile', { body: { username: form.username }, model: staffProfileModel }),
    { success: 'Profile updated.', error: 'Could not update your profile' },
  )
  const uploadLogo = useApiMutation(
    (file: File) => api.post('/admin/users/me/logo', { body: { file }, model: staffProfileModel }),
    { success: 'Logo updated.', error: 'Could not upload the logo' },
  )
  const removeLogo = useApiMutation(
    () => api.delete('/admin/users/me/logo', { model: staffProfileModel }),
    { success: 'Logo removed.', error: 'Could not remove the logo' },
  )

  return {
    profile: session.staff,
    renaming: rename.pending,
    uploading: uploadLogo.pending,
    removing: removeLogo.pending,
    saveName: async (form: IProfileSchema) => refreshSession((await rename.execute(form)).ok),
    saveLogo: async (file: File) => refreshSession((await uploadLogo.execute(file)).ok),
    deleteLogo: async () => refreshSession((await removeLogo.execute()).ok),
  }
}
