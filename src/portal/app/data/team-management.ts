import type { AcceptLiteral } from '~/types/common'
import type { ModalConfirmationProps } from '~/components/modal/ModalConfirmation.vue'
import type { NuxtUIColor } from '~/types/nuxt-ui'

export type StatusType = 'ACTIVE' | 'DEACTIVATED' | 'INVITED_PENDING' | 'INVITED_EXPIRED'
export type ConfirmationActionType = 'DEACTIVATE' | 'REMOVE' | 'CANCEL_INVITE' | 'REACTIVATE'

export interface TeamSummaryItem {
  label: string
  icon: string
  total: string
  color: NuxtUIColor
}

export interface StatusItem {
  label: string
  color: NuxtUIColor
}

export interface SelectedItem {
  status: string
  email: string
  memberId: number
}

export interface OpenItem {
  editEmail: boolean
  changeRole: boolean
  requestSeat: boolean
  inviteMember: boolean
  confirmation: boolean
  alertRequestSeat: boolean
  successSeatRequest: boolean
}

export interface TableItem {
  id: number
  name: string
  email: string
  profile: string
  role: string
  status: StatusType
  lastActive: string
}

interface StatusFilterItem {
  label: string
  value: AcceptLiteral<StatusType>
}

export interface ConfirmationActionItem extends ModalConfirmationProps {
  onLeft: (callback: () => void) => void
  onRight: (callback: () => void) => void
}

export const confirmationActionMap = {
  DEACTIVATE: {
    title: 'Deactivate Member',
    description: 'Deactivated users cannot log in until reactivated. Their data and history will be kept',
    labelLeft: 'Cancel',
    labelRight: 'Deactivate',
    loading: false,
    onLeft: callback => callback(),
    onRight: callback => callback(),
  },
  REMOVE: {
    title: 'Remove from Workspace?',
    description: 'This permanently removes workspace access. The user will not be able to log back in unless invited again.',
    labelLeft: 'Cancel',
    labelRight: 'Remove ',
    loading: false,
    onLeft: callback => callback(),
    onRight: callback => callback(),
  },
  CANCEL_INVITE: {
    title: 'Cancel Invitation?',
    description: 'This will remove the pending invitation. The user will no longer be able to join using the previous invite link.',
    labelLeft: 'Cancel',
    labelRight: 'Proceed',
    loading: false,
    onLeft: callback => callback(),
    onRight: callback => callback(),
  },
  REACTIVATE: {
    title: 'Reactivate Member',
    description: 'This user will regain access immediately.',
    labelLeft: 'Cancel',
    labelRight: 'Reactivate',
    loading: false,
    onLeft: callback => callback(),
    onRight: callback => callback(),
  },
} satisfies Record<ConfirmationActionType, ConfirmationActionItem>

export const statusMap = {
  ACTIVE: {
    label: 'Active',
    color: 'success',
  },
  INVITED_EXPIRED: {
    label: 'Invited - Expired',
    color: 'error',
  },
  INVITED_PENDING: {
    label: 'Invited - Pending',
    color: 'info',
  },
  DEACTIVATED: {
    label: 'Deactivated',
    color: 'neutral',
  },
} satisfies Record<StatusType, StatusItem>

export const statusFilterItems: StatusFilterItem[] = [
  {
    label: 'All Status',
    value: 'ALL',
  },
  {
    label: 'Active',
    value: 'ACTIVE',
  },
  {
    label: 'Deactivate',
    value: 'DEACTIVATED',
  },
  {
    label: 'Invited - Expired',
    value: 'INVITED_EXPIRED',
  },
  {
    label: 'Invited - Pending',
    value: 'INVITED_PENDING',
  },
]
