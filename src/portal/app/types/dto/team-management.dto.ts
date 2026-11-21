import type { BaseRes } from './base.dto'
import type { AcceptLiteral } from '../common'
import type { RoleData } from './role.dto'

export type TeamMemberStatus = 'ACTIVE' | 'INVITED_EXPIRED' | 'INVITED_PENDING' | 'DEACTIVATED'

interface BaseTeamParam {
  companyId: number
  memberId: number
}

// Param
export type TeamEmailParam = BaseTeamParam
export type TeamCancelParam = BaseTeamParam
export type TeamRemovalParam = BaseTeamParam
export type TeamChangeRoleParam = BaseTeamParam
export type TeamChangeStatusParam = BaseTeamParam
export type TeamResendInvitationParam = BaseTeamParam
export type TeamMemberParam = Pick<BaseTeamParam, 'companyId'>
export type TeamSummaryParam = Pick<BaseTeamParam, 'companyId'>
export type TeamInvitationParam = Pick<BaseTeamParam, 'companyId'>
export type TeamSeatRequestParam = Pick<BaseTeamParam, 'companyId'>

// Query
export interface TeamMemberQuery {
  page?: number
  size?: number
  search?: string
  status?: AcceptLiteral<TeamMemberStatus>
}

// Data
export type TeamCancelData = string
export type TeamRemovalData = string
export type TeamEmailData = TeamMemberData
export type TeamInvitationData = TeamMemberData
export type TeamChangeRoleData = TeamMemberData
export type TeamChangeStatusData = TeamMemberData

export interface TeamSummaryData {
  totalMembers: number
  activeUsers: number
  pendingInvites: number
  maximumMembers: number
  deactivates: number
}

export interface TeamMemberData {
  id: number
  sub: string
  email: string
  fullName: string
  role: RoleData
  lastActiveAt: string
  status: TeamMemberStatus
}

export interface TeamSeatRequestData {
  id: number
  additionalSeats: number
  message: string
  seatRequestCompanyResonse: {
    companyId: number
    companyName: string
    email: string
  }
}

// TODO: this must fix with backend for consistency
// export type TeamMemberRes = BaseRes<{
//   content: TeamMemberData[]
// } & BaseQueryRes>

// Request
export interface TeamEmailReq {
  newEmail: string
}

export interface TeamInvitationReq {
  email: string
  roleId: number
  jobTitle: string
}

export interface TeamSeatRequestReq {
  message: string
  seatNumber: number
  agreeToContact: boolean
}

export interface TeamChangeRoleReq {
  roleId: number
}

export interface TeamChangeStatusReq {
  status: AcceptLiteral<TeamMemberStatus>
}

// Response
export type TeamCancelRes = BaseRes<TeamCancelData>
export type TeamRemovalRes = BaseRes<TeamRemovalData>
export type TeamSummaryRes = BaseRes<TeamSummaryData>
export type TeamEmailRes = BaseRes<TeamInvitationData>
export type TeamInvitationRes = BaseRes<TeamEmailData>
export type TeamMemberRes = BaseRes<TeamMemberData[]>
export type TeamChangeRoleRes = BaseRes<TeamChangeRoleData>
export type TeamResendInvitationRes = BaseRes<TeamMemberData>
export type TeamSeatRequestRes = BaseRes<TeamSeatRequestData>
export type TeamChangeStatusRes = BaseRes<TeamChangeStatusData>
