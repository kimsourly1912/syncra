import type { BaseRes } from './base.dto'

export interface ActorSnapshot {
  schemaVersion: number
  id: string
  name: string | null
  email: string
  profilePic: string | null
  role: string | null
}

export interface ModuleSnapshot {
  schemaVersion: number
  id: number
  code: string
  name: string
}

export interface DocAIJobEntitySnapshot {
  type: 'DOCAI_JOB'
  schemaVersion: number
  id: number
  displayName: string
  displayId: number
  processorCode: string
  processorName: string
  fileCount: number
  tokensUsed: number | null
  modelTokens?: number | null
  creditsCharged: number | null
  status: string | null
  createdAt: string | null
  finishedAt: string | null
}

export type EntitySnapshot = DocAIJobEntitySnapshot

export type ActivityLogCategory = 'DOCUMENT' | 'AUTH' | 'SETTINGS' | 'BILLING'
export type ActivityLogAction = 'DOCUMENT_PROCESSED' | 'LOGIN' | 'LOGOUT' | 'SETTINGS_UPDATED'
export type ActivityLogStatus = 'SUCCESS' | 'FAILURE' | 'PENDING'
export type ActorType = 'USER' | 'SYSTEM'

export interface ActivityLogEntry {
  id: number
  displayId: number
  actor: ActorSnapshot
  actorType: ActorType
  category: ActivityLogCategory
  action: ActivityLogAction
  status: ActivityLogStatus
  module: ModuleSnapshot
  entity: EntitySnapshot
  summary: string
  createdAt: string
}

export interface ActivityLogListData {
  logs: ActivityLogEntry[]
  page: number
  size: number
  totalPages: number
  totalElements: number
}

export interface ActivityLogFilter {
  actorId?: string
  moduleId?: number
  startDate?: string
  endDate?: string
}

export type ActivityLogListRes = BaseRes<ActivityLogListData>
