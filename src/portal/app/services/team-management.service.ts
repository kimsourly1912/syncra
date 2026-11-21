import type { TeamManagementDTO } from '@/types/dto'

export const ENDPOINT = {
  prefix: '/company',
  parts: {
    role: 'role',
    status: 'status',
    remove: 'remove',
    cancel: 'cancel',
    summary: 'summary',
    members: 'members',
    editEmail: 'edit-email',
    invitations: 'invitations',
    teamMembers: 'team-members',
    resendInvite: 'resend-invite',
    seatRequests: 'seat-requests',
  },
} as const

type Parts = typeof ENDPOINT.parts

export function findTeamSummary(param: TeamManagementDTO.TeamSummaryParam) {
  const { companyId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'team-members', 'summary'])
  return useAPI<TeamManagementDTO.TeamSummaryRes>(endpoint, { method: 'GET' })
}

export function getTeamMembers(param: TeamManagementDTO.TeamMemberParam, query: TeamManagementDTO.TeamMemberQuery = {}) {
  const { companyId } = param
  const { page = 0, search = '', size = 10, status = '' } = query
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'team-members', 'members'])
  return useAPI<TeamManagementDTO.TeamMemberRes>(endpoint,
    {
      method: 'GET',
      query: {
        page, search, size, status,
      },
    },
  )
}

export function createTeamInvitation(param: TeamManagementDTO.TeamInvitationParam, req: TeamManagementDTO.TeamInvitationReq) {
  const { companyId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'team-members', 'invitations'])
  return useAPI<TeamManagementDTO.TeamInvitationRes>(endpoint,
    {
      method: 'POST',
      body: req,
    },
  )
}

export function updateTeamEmail(param: TeamManagementDTO.TeamEmailParam, req: TeamManagementDTO.TeamEmailReq) {
  const { companyId, memberId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'team-members', memberId, 'edit-email'])
  return useAPI<TeamManagementDTO.TeamInvitationRes>(endpoint,
    {
      method: 'PATCH',
      body: req,
    },
  )
}

export function removeTeam(param: TeamManagementDTO.TeamRemovalParam) {
  const { companyId, memberId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'team-members', memberId, 'remove'])
  return useAPI<TeamManagementDTO.TeamRemovalRes>(endpoint,
    { method: 'DELETE' },
  )
}

export function resendTeamInvitation(param: TeamManagementDTO.TeamResendInvitationParam) {
  const { companyId, memberId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'team-members', memberId, 'resend-invite'])
  return useAPI<TeamManagementDTO.TeamResendInvitationRes>(endpoint,
    { method: 'POST' },
  )
}

export function cancelTeam(param: TeamManagementDTO.TeamCancelParam) {
  const { companyId, memberId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'team-members', memberId, 'cancel'])
  return useAPI<TeamManagementDTO.TeamCancelRes>(endpoint,
    { method: 'DELETE' },
  )
}

export function createSeatRequest(param: TeamManagementDTO.TeamSeatRequestParam, req: TeamManagementDTO.TeamSeatRequestReq) {
  const { companyId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'team-members', 'seat-requests'])
  return useAPI<TeamManagementDTO.TeamSeatRequestRes>(endpoint, { method: 'POST', body: req })
}

export function changeRole(param: TeamManagementDTO.TeamChangeRoleParam, req: TeamManagementDTO.TeamChangeRoleReq) {
  const { companyId, memberId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'team-members', memberId, 'role'])
  return useAPI<TeamManagementDTO.TeamChangeRoleRes>(endpoint, { method: 'PATCH', body: req })
}

export function changeStatus(param: TeamManagementDTO.TeamChangeStatusParam, req: TeamManagementDTO.TeamChangeStatusReq) {
  const { companyId, memberId } = param
  const endpoint = buildEndPoint<Parts>(ENDPOINT.prefix, [companyId, 'team-members', memberId, 'status'])
  return useAPI<TeamManagementDTO.TeamChangeStatusRes>(endpoint, { method: 'PATCH', body: req })
}
