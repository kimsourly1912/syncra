<script lang="ts">
import type { ConcreteComponent, VNode } from 'vue'
import type { TeamManagementDTO } from '@/types/dto'
import type { ObjectValueToString } from '~/types/common'
import type { TableColumn, DropdownMenuItem, TableRow, DropdownMenuProps, FormSubmitEvent, SelectItem } from '@nuxt/ui'
import type { IEditEmailSchema, IInviteMemberSchema, ISeatRequestSchema, IChangeRoleSchema } from '@/schema/team-management.schema'
import type { OpenItem, TableItem, StatusType, SelectedItem, ConfirmationActionType, TeamSummaryItem } from '@/data/team-management'
</script>

<script lang="ts" setup>
import { ASYNC_DATA } from '~/constants/key'
import * as roleService from '@/services/role.service'
import { UBadge, UButton, UDropdownMenu, NuxtImg } from '#components'
import * as teamManagementService from '@/services/team-management.service'
import { statusFilterItems, statusMap, confirmationActionMap } from '@/data/team-management'
import { editEmailSchema, inviteMemberSchema, seatRequestSchema, changeRoleSchema } from '@/schema/team-management.schema'

const { toast } = useAppToast()
const profileStore = useProfileStore()

const search = shallowRef('')
const tableRef = useTemplateRef('table-ref')
const confirmationActionType = shallowRef<ConfirmationActionType>('DEACTIVATE')
const jobTitleItems = ref(['QA/QC', 'Merchandiser', 'Product Developer'])

const open = reactive<OpenItem>({
  editEmail: false,
  changeRole: false,
  requestSeat: false,
  inviteMember: false,
  confirmation: false,
  alertRequestSeat: false,
  successSeatRequest: false,
})

const selected = reactive<SelectedItem>({
  email: '',
  memberId: -1,
  status: statusFilterItems[0]!.value,
})

const editEmail = editEmailProps()
const changeRole = changeRoleProps()
const removeTeam = removeTeamProps()
const seatRequest = seatRequestProps()
const cancelEmail = cancelEmailProps()
const resendEmail = resendEmailProps()
const changeStatus = changeStatusProps()
const inviteMember = inviteMemberProps()

const { data: roleData } = useAsyncData(ASYNC_DATA.roles, () => roleService.getRoles(), { lazy: true })

const { data: teamMembersData, pending: teamMembersPending, execute: teamMembersExecute } = useAsyncData(ASYNC_DATA.teamMembers, async () => {
  const { data } = await teamManagementService.getTeamMembers({ companyId: profileStore.companyId })
  return data
}, { lazy: true })

const { data: teamSummaryData, pending: teamSummaryPending, execute: teamSummaryExecute } = useAsyncData(ASYNC_DATA.teamSummary, async () => {
  const { data } = await teamManagementService.findTeamSummary({ companyId: profileStore.companyId })
  const { maximumMembers, totalMembers, activeUsers, deactivates, pendingInvites } = data

  function generateStatus() {
    let active = activeUsers
    let deactive = deactivates
    let pending = pendingInvites

    return Array.from({ length: totalMembers }, () => {
      // ordering matter: active -> inactive -> pending
      if (active > 0) {
        active -= 1
        return 'active' as const
      }

      if (deactive > 0) {
        deactive -= 1
        return 'inactive' as const
      }

      if (pending > 0) {
        pending -= 1
        return 'pending' as const
      }

      return 'unknown' as const
    })
  }

  const metadata = [
    {
      label: 'Active',
      value: activeUsers,
    },
    {
      label: 'Inactive',
      value: deactivates,
    },
    {
      label: 'Pending Invite',
      value: pendingInvites,
    },
  ].filter(o => o.value > 0)

  return {
    ...data,
    metadata,
    statuses: generateStatus(),
    isMaxInvited: totalMembers >= maximumMembers,
    allSeatsOccupied: maximumMembers === activeUsers,
  }
}, { lazy: true })

const roleDataToOptions = computed(() => {
  if (!roleData.value?.data.length) return []
  return roleData.value.data.map<SelectItem>(o => ({
    label: o.name,
    value: `${o.id}`,
    disabled: o.code === 'ADMIN',
  }))
})

// TODO: can be static or dynamic as required
const mockSeatItems = computed(() => {
  const seats = [5, 10, 15, 20, 50, 0]
  return seats.map<SelectItem>(o => ({
    value: String(o),
    label: o === 0 ? 'Custom' : `+${o}`,
  }))
})

const teamSummaryItems = computed(() => {
  if (!teamSummaryData.value) return []
  const { activeUsers, deactivates, maximumMembers, pendingInvites, totalMembers } = teamSummaryData.value
  return [
    {
      label: 'Total Members',
      total: `${totalMembers} / ${maximumMembers}`,
      icon: 'lucide:users',
      color: 'primary',
    },
    {
      label: 'Active',
      total: `${activeUsers}`,
      icon: 'lucide:check',
      color: 'success',
    },
    {
      label: 'Deactivated',
      total: `${deactivates}`,
      icon: 'lucide:circle-x',
      color: 'neutral',
    },
    {
      label: 'Pending Invites',
      total: `${pendingInvites}`,
      icon: 'lucide:clock',
      color: 'info',
    },
  ] satisfies TeamSummaryItem[]
})

const tableData = computed(() => {
  if (!teamMembersData.value) return []
  const data = teamMembersData.value
  return data.map<TableItem>(o => ({
    id: o.id,
    email: o.email,
    name: o.fullName ?? '',
    profile: '/img/syncra-logo.png',
    role: o.role.name,
    status: o.status as StatusType,
    lastActive: o.lastActiveAt ?? '',
  }))
})

const tableColumns: TableColumn<TableItem>[] = [
  {
    accessorKey: 'member',
    header: 'Member',
    cell: ({ row }) => {
      const { profile, name } = row.original
      return h('div', { class: tw`flex items-center gap-5` }, [
        h('div', { class: tw`size-10 rounded-full overflow-hidden` },
          h(NuxtImg as unknown as VNode, {
            src: profile,
            width: 40,
            height: 40,
            class: tw`size-full object-cover`,
          })),
        h('span', { class: tw`text-highlighted` }, name),
      ])
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      return h('span', { class: tw`text-highlighted` }, row.original.role)
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const v = statusMap[row.original.status]
      return h(UBadge, { variant: 'soft', color: v.color }, () => v.label)
    },
  },
  // {
  //   accessorKey: 'lastActive',
  //   header: 'Last Active',
  // },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      // Hide the actions menu for the current logged in user or if the user is an admin
      const isCurrentUser = row.original.email === profileStore.data?.email || row.original.email === profileStore.cookieUsername
      const isAdmin = row.original.role.toLowerCase() === 'admin'

      if (isCurrentUser || isAdmin) {
        return h('span')
      }

      return h(UDropdownMenu as ConcreteComponent<DropdownMenuProps>, {
        items: getActionItems(row),
        content: {
          align: 'end',
        },
      },
      () => h(UButton, {
        variant: 'ghost',
        icon: 'lucide:ellipsis-vertical',
        color: 'neutral',
      }),
      )
    },
  },
]

const confirmationActionValue = computed(() => confirmationActionMap[confirmationActionType.value])

function setFilterValue(name: keyof TableItem, value: string) {
  if (!tableRef.value) return
  const col = tableRef.value.tableApi.getColumn(name)
  const v = value === 'ALL' ? '' : value
  col?.setFilterValue(v)
}

function executeActionType(type: ConfirmationActionType, fn: () => void) {
  if (confirmationActionType.value === type) {
    fn()
  }
}

function setSelect(item: TableItem) {
  selected.memberId = item.id
  selected.email = item.email
}

function setConfirmation(item: TableItem, action: ConfirmationActionType) {
  setSelect(item)
  open.confirmation = true
  confirmationActionType.value = action
}

function getActionItems(row: TableRow<TableItem>) {
  const { original } = row

  const actionMap = {
    ACTIVE: [
      {
        disabled: true, // TODO: enable once feature available to use
        label: 'Change Role',
        icon: 'lucide:refresh-cw',
        onSelect() {
          setSelect(original)
          open.changeRole = true
        },
      },
      {
        label: 'Deactivate User',
        icon: 'app:shut-down',
        onSelect() {
          setConfirmation(original, 'DEACTIVATE')
        },
      },
      {
        label: 'Remove from workspace',
        icon: 'lucide:circle-minus',
        onSelect() {
          setConfirmation(original, 'REMOVE')
        },
      },
    ],
    INVITED_PENDING: [
      {
        label: 'Resend Invite',
        icon: 'lucide:send',
        onSelect() {
          setSelect(original)
          resendEmail.execute()
        },
      },
      {
        label: 'Edit Email',
        icon: 'lucide:edit-3',
        onSelect() {
          setSelect(original)
          open.editEmail = true
          editEmail.data.email = original.email
        },
      },
      {
        label: 'Cancel Invite',
        icon: 'lucide:circle-x',
        onSelect() {
          setConfirmation(original, 'CANCEL_INVITE')
        },
      },
    ],
    INVITED_EXPIRED: [
      {
        label: 'Resend Invite',
        icon: 'lucide:send',
        onSelect() {
          setSelect(original)
          resendEmail.execute()
        },
      },
      {
        label: 'Edit Email',
        icon: 'lucide:edit-3',
        onSelect() {
          setSelect(original)
          open.editEmail = true
          editEmail.data.email = original.email
        },
      },
      {
        label: 'Cancel Invite',
        icon: 'lucide:circle-x',
        onSelect() {
          setConfirmation(original, 'CANCEL_INVITE')
        },
      },
    ],
    DEACTIVATED: [
      {
        label: 'Reactivate User',
        icon: 'app:shut-down',
        onSelect() {
          setConfirmation(original, 'REACTIVATE')
        },
      },
      {
        label: 'Remove from workspace',
        icon: 'lucide:circle-minus',
        onSelect() {
          setConfirmation(original, 'REMOVE')
        },
      },
    ],
  } satisfies Record<StatusType, DropdownMenuItem[]>

  return actionMap[original.status]
}

function refreshData() {
  return Promise.all([teamMembersExecute(), teamSummaryExecute()])
}

function inviteMemberProps() {
  const data = reactive<IInviteMemberSchema>({
    email: '',
    jobTitle: '',
    role: 'OPERATOR',
  })

  const pending = shallowRef(false)

  const FIELD_NAME = {
    email: 'email',
    role: 'role',
    jobTitle: 'jobTitle',
  } satisfies IInviteMemberSchema

  async function submit(evt: FormSubmitEvent<IInviteMemberSchema>) {
    const role = roleData.value?.data.find(o => o.code === 'OPERATOR')
    if (!role) {
      toast.add('success', { title: 'Failed', description: 'No role ID provided' })
      return
    }

    const { email, jobTitle } = evt.data
    pending.value = true
    try {
      await teamManagementService.createTeamInvitation(
        { companyId: profileStore.companyId },
        { email, roleId: role.id, jobTitle },
      )
      open.inviteMember = false
      await refreshData()
      toast.add('success', { title: 'Invitation sent to', description: email })
    }
    catch (e) {
      toast.addException(e)
    }
    finally {
      pending.value = false
    }
  }

  function clearAll() {
    data.role = ''
    data.email = ''
    data.jobTitle = ''
  }

  return {
    data,
    pending,
    FIELD_NAME,
    submit,
    clearAll,
  }
}

function editEmailProps() {
  const data = reactive<IEditEmailSchema>({
    email: '',
  })

  const pending = shallowRef(false)

  const FIELD_NAME = {
    email: 'email',
  } satisfies IEditEmailSchema

  async function submit(evt: FormSubmitEvent<IEditEmailSchema>) {
    const { email } = evt.data
    pending.value = true
    try {
      const { success } = await teamManagementService.updateTeamEmail(
        { companyId: profileStore.companyId, memberId: selected.memberId },
        { newEmail: email },
      )
      if (success) {
        open.editEmail = false
        await teamMembersExecute()
        toast.add('success', { title: 'Invitation email update for', description: email })
      }
    }
    catch (e) {
      toast.addException(e)
    }
    finally {
      pending.value = false
    }
  }

  function clearAll() {
    data.email = ''
  }

  return {
    data,
    pending,
    FIELD_NAME,
    submit,
    clearAll,
  }
}

function resendEmailProps() {
  const pending = shallowRef(false)

  async function execute() {
    pending.value = true
    try {
      const { success } = await teamManagementService.resendTeamInvitation({ companyId: profileStore.companyId, memberId: selected.memberId })
      if (success) {
        toast.add('success', { title: 'Invitation resent to', description: selected.email })
      }
    }
    catch (e) {
      toast.addException(e)
    }
    finally {
      pending.value = false
    }
  }

  return {
    pending,
    execute,
  }
}

function cancelEmailProps() {
  const pending = shallowRef(false)

  async function execute() {
    pending.value = true
    try {
      await teamManagementService.cancelTeam({ companyId: profileStore.companyId, memberId: selected.memberId })
      open.confirmation = false
      await refreshData()
      toast.add('success', { title: 'Invitation canceled for', description: selected.email })
    }
    catch (e) {
      toast.addException(e)
    }
    finally {
      pending.value = false
    }
  }

  return {
    pending,
    execute,
  }
}

function removeTeamProps() {
  const pending = shallowRef(false)

  async function execute() {
    pending.value = true
    try {
      await teamManagementService.removeTeam({ companyId: profileStore.companyId, memberId: selected.memberId })
      open.confirmation = false
      await refreshData()
      toast.add('success', { title: 'User has been Removed from Workspace', description: selected.email })
    }
    catch (e) {
      toast.addException(e)
    }
    finally {
      pending.value = false
    }
  }

  return {
    pending,
    execute,
  }
}

function seatRequestProps() {
  const data = reactive<ISeatRequestSchema>({
    seat: '',
    message: '',
    agreed: true,
  })

  const pending = shallowRef(false)
  const customSeat = shallowRef(1)

  const FIELD_NAME = {
    seat: 'seat',
    agreed: 'agreed',
    message: 'message',
  } satisfies ObjectValueToString<ISeatRequestSchema>

  async function submit(evt: FormSubmitEvent<ISeatRequestSchema>) {
    pending.value = true
    const { agreed, seat, message } = evt.data
    const seatNumber = Number(seat) || customSeat.value
    try {
      const { success } = await teamManagementService.createSeatRequest(
        { companyId: profileStore.companyId },
        {
          seatNumber,
          message: message ?? '',
          agreeToContact: agreed ?? true,
        },
      )
      if (success) {
        open.requestSeat = false
        open.successSeatRequest = true
      }
    }
    catch (e) {
      toast.addException(e)
    }
    finally {
      pending.value = false
    }
  }

  function clearAll() {
    data.seat = ''
    data.message = ''
    data.agreed = true
    customSeat.value = 1
  }

  return {
    data,
    pending,
    FIELD_NAME,
    customSeat,
    clearAll,
    submit,
  }
}

function changeRoleProps() {
  const data = reactive<IChangeRoleSchema>({
    role: '',
  })

  const pending = shallowRef(false)

  const FIELD_NAME = {
    role: 'role',
  } satisfies IChangeRoleSchema

  async function submit(evt: FormSubmitEvent<IChangeRoleSchema>) {
    const { role } = evt.data
    pending.value = true
    try {
      await teamManagementService.changeRole(
        { companyId: profileStore.companyId, memberId: selected.memberId },
        { roleId: +role },
      )
      open.changeRole = false
      await teamMembersExecute()
      toast.add('success', { title: 'Role Update for', description: selected.email })
    }
    catch (e) {
      toast.addException(e)
    }
    finally {
      pending.value = false
    }
  }

  function clearAll() {
    data.role = ''
  }

  return {
    data,
    pending,
    FIELD_NAME,
    clearAll,
    submit,
  }
}

function changeStatusProps() {
  const pending = shallowRef(false)

  const messageMap: Record<TeamManagementDTO.TeamMemberStatus, string> = {
    INVITED_EXPIRED: '',
    INVITED_PENDING: '',
    ACTIVE: 'User has been Re-activated',
    DEACTIVATED: 'User has been Deactivated',
  }

  async function execute(status: TeamManagementDTO.TeamMemberStatus) {
    pending.value = true
    try {
      await teamManagementService.changeStatus(
        { companyId: profileStore.companyId, memberId: selected.memberId },
        { status },
      )
      open.confirmation = false
      await refreshData()
      toast.add('success', { title: messageMap[status], description: selected.email })
    }
    catch (e) {
      toast.addException(e)
    }
    finally {
      pending.value = false
    }
  }

  return {
    pending,
    execute,
  }
}

function clearFilter() {
  search.value = ''
  selected.status = statusFilterItems[0]!.value
}

function handleInviteClick() {
  if (teamSummaryData.value?.isMaxInvited) {
    open.alertRequestSeat = true
  }
  else {
    open.inviteMember = true
  }
}

function createJobTitle(data: string) {
  jobTitleItems.value.push(data)
  inviteMember.data.jobTitle = data
}

watch(selected, ({ status }) => {
  setFilterValue('status', status)
})

watch(teamMembersData, () => {
  setFilterValue('status', selected.status)
})

watch(() => open.inviteMember, () => {
  inviteMember.clearAll()
  inviteMember.data.role = 'OPERATOR'
})

watch(() => open.requestSeat, () => {
  seatRequest.clearAll()
})

watch(() => open.changeRole, () => {
  changeRole.clearAll()
})

useHead({
  titleTemplate: 'Team Management - %s',
})
</script>

<template>
  <UDashboardPanel
    id="team-management"
  >
    <template #header>
      <LayoutHeader title="Team Management" />
    </template>

    <template #body>
      <LayoutContent>
        <LayoutWrapper
          title="Team Management"
          description="View and manage your team members, roles, and permissions."
        >
          <template #suffix>
            <UButton
              label="Invite Member"
              icon="lucide:mail"
              @click="handleInviteClick"
            />
          </template>

          <ul class="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            <TeamSummaryItem
              :items="teamSummaryItems"
              :pending="teamSummaryPending"
            />
          </ul>
        </LayoutWrapper>

        <LayoutWrapper title="Team Members">
          <UCard :ui="{ body: tw`p-0 sm:p-0`, header: tw`p-2.5 sm:px-2.5` }">
            <template #header>
              <section class="flex sm:items-center gap-4 sm:flex-row flex-col">
                <section class="flex-1">
                  <UInput
                    id="search-members"
                    v-model="search"
                    icon="lucide:search"
                    class="w-full"
                    placeholder="Search Members"
                  />
                </section>

                <section class="flex items-center gap-2">
                  <USelect
                    v-model="selected.status"
                    class="sm:w-44 w-full"
                    :items="statusFilterItems"
                  />
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="lucide:x"
                    label="Clear"
                    @click="clearFilter"
                  />
                </section>
              </section>
            </template>

            <UTable
              ref="table-ref"
              v-model:global-filter="search"
              :loading="teamMembersPending"
              loading-animation="swing"
              :ui="{
                th: tw`bg-elevated`,
              }"
              :data="tableData"
              :columns="tableColumns"
            />
          </UCard>
        </LayoutWrapper>
      </LayoutContent>

      <!-- Invite Member -->
      <UModal
        v-model:open="open.inviteMember"
        class="max-w-xl"
        title="Invite New Member"
        description="Grant access to Syncra and assign a role."
      >
        <template #body="{ close }">
          <UForm
            :state="inviteMember.data"
            :schema="inviteMemberSchema"
            class="flex flex-col gap-6"
            @submit="inviteMember.submit"
          >
            <UFormField
              label="Email Address"
              class="w-full"
              :name="inviteMember.FIELD_NAME.email"
              required
            >
              <UInput
                v-model="inviteMember.data.email"
                class="w-full"
                placeholder="example@gmail.com"
              />
            </UFormField>

            <UFormField
              label="Job Title"
              :name="inviteMember.FIELD_NAME.jobTitle"
              required
            >
              <USelectMenu
                v-model="inviteMember.data.jobTitle"
                class="w-full"
                :items="jobTitleItems"
                clear
                create-item
                :search-input="{
                  placeholder: 'Create or search...',
                }"
                @create="createJobTitle"
              />
            </UFormField>

            <footer class="flex gap-4">
              <UButton
                label="Cancel"
                color="neutral"
                variant="outline"
                block
                :disabled="inviteMember.pending.value"
                @click="close"
              />
              <UButton
                type="submit"
                label="Send Invite"
                block
                color="neutral"
                :loading="inviteMember.pending.value"
              />
            </footer>
          </UForm>
        </template>
      </UModal>

      <!-- Edit Email -->
      <UModal
        v-model:open="open.editEmail"
        class="max-w-xl"
        title="Edit Invitation Email"
      >
        <template #description>
          <span>Current Email: <span class="font-semibold text-primary">{{ selected.email }}</span></span>
        </template>

        <template #body="{ close }">
          <p class="text-muted text-sm">
            Update the email for this pending member. A new invitation link will be sent.
          </p>

          <UForm
            :state="editEmail.data"
            :schema="editEmailSchema"
            class="flex flex-col gap-6 mt-6"
            @submit="editEmail.submit"
          >
            <UFormField
              label="Email Address"
              class="w-full"
              :name="editEmail.FIELD_NAME.email"
              required
            >
              <UInput
                v-model="editEmail.data.email"
                class="w-full"
                placeholder="example@gmail.com"
              />
            </UFormField>

            <footer class="flex gap-4">
              <UButton
                label="Cancel"
                color="neutral"
                variant="outline"
                block
                :disabled="editEmail.pending.value"
                @click="close"
              />
              <UButton
                label="Resend"
                block
                type="submit"
                color="neutral"
                :loading="editEmail.pending.value"
              />
            </footer>
          </UForm>
        </template>
      </UModal>

      <!-- Change Role -->
      <UModal
        v-model:open="open.changeRole"
        class="max-w-xl"
        title="Change Role"
        description="Update this member's role in Syncra"
      >
        <template #body="{ close }">
          <UForm
            :state="changeRole.data"
            :schema="changeRoleSchema"
            class="flex flex-col gap-6"
            @submit="changeRole.submit"
          >
            <UFormField
              label="New Role"
              required
              :name="changeRole.FIELD_NAME.role"
            >
              <USelect
                v-model="changeRole.data.role"
                class="w-full"
                :items="roleDataToOptions"
                placeholder="Search a role"
              />
            </UFormField>

            <UBadge
              icon="lucide:info"
              color="info"
              variant="soft"
              label="Changing this member's role will update their access immediately."
            />

            <footer class="flex gap-4">
              <UButton
                label="Cancel"
                color="neutral"
                variant="outline"
                block
                @click="close"
              />
              <UButton
                type="submit"
                label="Update Role"
                block
                color="neutral"
                :loading="changeRole.pending.value"
              />
            </footer>
          </UForm>
        </template>
      </UModal>

      <!-- Alert Request Seat -->
      <UModal
        v-model:open="open.alertRequestSeat"
      >
        <template #title>
          <div class="flex items-center gap-2">
            <UIcon
              name="lucide:info"
              :class="[teamSummaryData?.allSeatsOccupied ? 'text-error' : 'text-warning', 'text-xl']"
            />
            <h1>{{ teamSummaryData?.allSeatsOccupied ? 'All Seat Occupied' : 'No Available Seats' }}</h1>
          </div>
        </template>
        <template #description>
          <p>
            {{
              teamSummaryData?.allSeatsOccupied
                ? `You've reached your limit of ${teamSummaryData.maximumMembers} team members.`
                : `Your seat limit is full, but some accounts are currently inactive or pending invite.`
            }}
          </p>
        </template>

        <template #body>
          <template v-if="teamSummaryData">
            <main class="space-y-4">
              <section class="flex flex-wrap gap-3 items-center">
                <ul class="flex gap-2 flex-wrap">
                  <li
                    v-for="(o, idx) in teamSummaryData.statuses"
                    :key="idx"
                    :data-status="o"
                    class="group flex items-center justify-center shrink-0 size-8 rounded-full data-[status=active]:bg-primary bg-elevated"
                  >
                    <UIcon
                      name="lucide:user"
                      :data-status="o"
                      class="data-[status=active]:text-white text-muted"
                    />
                  </li>
                </ul>
                <section class="space-y-1">
                  <h1 class="font-semibold">
                    ({{ teamSummaryData.totalMembers }}/{{ teamSummaryData.maximumMembers }}) Seats Filled
                  </h1>
                  <template v-if="!teamSummaryData.allSeatsOccupied">
                    <ul class="flex gap-2 flex-wrap">
                      <li
                        v-for="(o, idx) in teamSummaryData.metadata"
                        :key="idx"
                        class="text-muted text-xs after:ml-1 after:content-['•'] last:after:hidden"
                      >
                        <span>{{ o.value }} {{ o.label }}</span>
                      </li>
                    </ul>
                  </template>
                </section>
              </section>

              <p class="text-muted text-sm">
                {{
                  teamSummaryData.allSeatsOccupied
                    ? 'To add more people to the Syncra platform, please contact our sales team to upgrade your plan.'
                    : 'To invite someone new, you must first remove an inactive or pending invite member to free up a seat.'
                }}
              </p>

              <template v-if="!teamSummaryData.allSeatsOccupied">
                <UAlert
                  color="neutral"
                  variant="soft"
                >
                  <template #description>
                    <p>
                      <span class="font-semibold">Alternative:</span>
                      Or, contact sales to add more seats to your account.
                    </p>
                  </template>
                </UAlert>
              </template>
            </main>
          </template>
          <template v-else>
            <EmptyData />
          </template>
        </template>
        <template #footer="{ close }">
          <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <template v-if="teamSummaryData?.allSeatsOccupied">
              <UButton
                block
                label="Cancel"
                variant="outline"
                color="neutral"
                @click="close"
              />
              <UButton
                block
                label="Contact Sales"
                @click="() => {
                  open.alertRequestSeat = false
                  open.requestSeat = true
                }"
              />
            </template>
            <template v-else>
              <UButton
                block
                label="Contact Sales"
                variant="outline"
                @click="() => {
                  open.alertRequestSeat = false
                  open.requestSeat = true
                }"
              />
              <UButton
                block
                label="Manage Members"
                @click="close"
              />
            </template>
          </div>
        </template>
      </UModal>

      <!-- Request Seat -->
      <UModal
        v-model:open="open.requestSeat"
        class="max-w-xl"
        title="Request Seat Expansion"
        description="Contact our sales team to upgrade your workspace."
      >
        <template #body>
          <UForm
            :state="seatRequest.data"
            :schema="seatRequestSchema"
            class="flex flex-col gap-6"
            @submit="seatRequest.submit"
          >
            <UFormField
              label="Additional Seats"
              required
              :name="seatRequest.FIELD_NAME.seat"
            >
              <section class="flex flex-col gap-2">
                <USelect
                  v-model="seatRequest.data.seat"
                  class="w-full"
                  :items="mockSeatItems"
                  placeholder="Select number of seats"
                />
                <template v-if="seatRequest.data.seat === '0'">
                  <UInputNumber
                    v-model="seatRequest.customSeat.value"
                    orientation="vertical"
                    class="w-full"
                    :min="1"
                    :max="99"
                    :increment="{ class: 'hidden' }"
                    :decrement="{ class: 'hidden' }"
                  />
                </template>
              </section>
            </UFormField>

            <UFormField
              label="Optional Message"
              :name="seatRequest.FIELD_NAME.message"
            >
              <UTextarea
                v-model="seatRequest.data.message"
                class="w-full"
              />
            </UFormField>

            <UButton
              type="submit"
              label="Submit"
              block
              color="neutral"
              :loading="seatRequest.pending.value"
            />
          </UForm>
        </template>
      </UModal>

      <ModalConfirmation
        v-model="open.confirmation"
        :title="confirmationActionValue.title"
        :description="confirmationActionValue.description"
        :label-left="confirmationActionValue.labelLeft"
        :label-right="confirmationActionValue.labelRight"
        :loading="cancelEmail.pending.value || removeTeam.pending.value || changeStatus.pending.value"
        @left="confirmationActionValue.onLeft(() => {})"
        @right="confirmationActionValue.onRight(() => {
          executeActionType('REMOVE', () => removeTeam.execute())
          executeActionType('CANCEL_INVITE', () => cancelEmail.execute())
          executeActionType('REACTIVATE', () => changeStatus.execute('ACTIVE'))
          executeActionType('DEACTIVATE', () => changeStatus.execute('DEACTIVATED'))
        })"
      />

      <ModalSuccess
        v-model="open.successSeatRequest"
        title="Thank you for reach out to us!"
        description="Our team has received your request and will reach out to you shortly to discuss next steps."
      />
    </template>
  </UDashboardPanel>
</template>
