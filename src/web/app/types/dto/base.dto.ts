import type { FetchError } from 'ofetch'

export interface BaseRes<T> {
  data: T
  success: boolean
  msg: string
  reason: string
}

export interface CreationDate {
  updatedAt: string
  createdAt: string
}

export interface BaseError {
  detail: string
  instance: string
  status: number
  title: string
  type: string
}

export type OFetchError = FetchError<BaseError>
