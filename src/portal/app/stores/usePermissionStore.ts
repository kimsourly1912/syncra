// import { STORE_ID } from '@/constants/key'

// export type PermissionRole = 'admin' | 'operator' | 'admin'
// export type PermissionActions = 'create' | 'read' | 'update' | 'delete'
// export type PermissionSubjects = 'application' | 'team-management' | 'setting' | 'activity'

// sample data
// const userData = {
//   id: 1,
//   name: 'Hello',
//   email: 'example@gmail.com',
//   role: 'admin',
//   permissions: {
//     'application': ['create', 'read', 'update', 'delete'],
//     'setting': ['read', 'update'],
//     'activity': ['read'],
//     'team-management': ['read'],
//   },
// }

// interface UsePermissionStoreOptions {
//   subject?: PermissionSubjects
// }

// export const usePermissionStore = defineStore(STORE_ID.permission, () => {
//   // const roles = shallowRef([])
//   // const permissions = shallowRef([])

//   function getActions(subject: PermissionSubjects) {
//     return userData.permissions[subject]
//   }

//   function can(action: PermissionActions, subject: PermissionSubjects) {
//     return userData.permissions[subject].includes(action)
//   }

//   function defineOptions(_: UsePermissionStoreOptions = {}) {

//   }

//   return {
//     can,
//     getActions,
//     defineOptions,
//   }
// })
