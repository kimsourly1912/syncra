import type { RoleDTO } from '@/types/dto'
import type { IRoute } from '~/constants/route'
import type { AcceptLiteral } from '~/types/common'

// these types will be replaced with DTO
export type PermissionRole = AcceptLiteral<RoleDTO.RoleType>
export type PermissionActions = 'create' | 'read' | 'update' | 'delete'
export type PermissionSubjects
  = | 'application'
    | 'application-ads'
    | 'team-management'
    | 'activity-history'
    | 'activity-log'
    | 'recent-activity'
    | 'recent-activity'
    | 'company-infomation'

type Permission = Record<PermissionSubjects, PermissionActions[]>

type PermissionMap = Record<PermissionRole, {
  routes: AcceptLiteral<IRoute>[]
  permission: Permission
}>

const roleMap: PermissionMap = {
  ADMIN: {
    permission: {
      'application': ['create', 'read', 'update', 'delete'],
      'activity-log': ['create', 'read', 'update', 'delete'],
      'application-ads': ['create', 'read', 'update', 'delete'],
      'team-management': ['read', 'create', 'update', 'delete'],
      'activity-history': ['read', 'create', 'update', 'delete'],
      'recent-activity': ['read', 'create', 'update', 'delete'],
      'company-infomation': ['read', 'create', 'update', 'delete'],
    },
    routes: ['all'],
  },
  OPERATOR: {
    permission: {
      'application': ['create', 'read', 'update', 'delete'],
      'activity-log': [],
      'application-ads': [],
      'team-management': [],
      'activity-history': ['read'],
      'recent-activity': ['read'],
      'company-infomation': ['read'],
    },
    routes: ['/', '/workspace', '/settings/account-profile', '/settings/company-information', '/workspace/create', '/workspace/activity-history', '/workspace/glossary', '/settings'],
  },
}

export function usePermission() {
  function getActions(role: PermissionRole, subject: PermissionSubjects) {
    return roleMap[role]?.permission[subject]
  }

  function getRoutes(role: PermissionRole) {
    return roleMap[role]?.routes ?? []
  }

  function can(role: PermissionRole, subject: PermissionSubjects, action: PermissionActions) {
    return getActions(role, subject)?.includes(action)
  }

  return {
    roleMap,
    getActions,
    can,
    getRoutes,
  }
}
