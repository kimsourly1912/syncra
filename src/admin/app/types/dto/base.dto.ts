export interface BaseRes<T> {
  data: T
  success: boolean
  msg: string
  reason: string
}

export interface SortItem {
  empty: boolean
  sorted: boolean
  unsorted: boolean
}

export interface PaginationItem {
  offset: number
  sort: SortItem
  paged: boolean
  pageNumber: number
  pageSize: number
  unpaged: boolean
}

export interface BaseQueryRes {
  size: number
  number: number
  sort: SortItem
  first: boolean
  last: boolean
  empty: boolean
  totalPages: number
  totalElements: number
  numberOfElements: number
  pageable: PaginationItem
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

export interface PageRes<T> {
  content: T[]
  totalElements: number
  totalPages: number
  pageNumber: number
  pageSize: number
}
