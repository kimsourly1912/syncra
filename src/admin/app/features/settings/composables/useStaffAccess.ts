import { api } from '@/api'
import type { IStaffEmailSchema, IStaffInviteSchema } from '../schemas/staff-access-form'

/**
 * Staff accounts, by email: invite one, resend the invitation, or turn sign-in off and on. The API
 * decides who may do this; it has no list of staff accounts, so there's nothing to show here.
 */
export function useStaffAccess() {
  const invite = useApiMutation(
    (form: IStaffInviteSchema) => api.post('/admin/users/invite', {
      body: { email: form.email, tempPassword: form.tempPassword, confirmPassword: form.confirmPassword },
    }),
    { success: (_, form) => `Invitation sent to ${form.email}.`, error: 'Could not invite the staff member' },
  )
  const resend = useApiMutation(
    (form: IStaffEmailSchema) => api.post('/admin/users/invite/resend', { body: { email: form.email } }),
    { success: (_, form) => `Invitation sent again to ${form.email}.`, error: 'Could not resend the invitation' },
  )
  const enable = useApiMutation(
    (form: IStaffEmailSchema) => api.post('/admin/users/enable', { body: { email: form.email } }),
    { success: (_, form) => `${form.email} can sign in again.`, error: 'Could not enable the account' },
  )
  const disable = useApiMutation(
    (form: IStaffEmailSchema) => api.post('/admin/users/disable', { body: { email: form.email } }),
    { success: (_, form) => `${form.email} can no longer sign in.`, error: 'Could not disable the account' },
  )

  return {
    invite: async (form: IStaffInviteSchema) => (await invite.execute(form)).ok,
    inviting: invite.pending,
    resend: async (form: IStaffEmailSchema) => (await resend.execute(form)).ok,
    enable: async (form: IStaffEmailSchema) => (await enable.execute(form)).ok,
    disable: async (form: IStaffEmailSchema) => (await disable.execute(form)).ok,
    /** One account action runs at a time. */
    acting: computed(() => resend.pending.value || enable.pending.value || disable.pending.value),
  }
}
