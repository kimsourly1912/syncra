import type { DocAIDTO } from '@/types/dto'
import { UBadge, UButton } from '#components'
import type { TableColumn, TableRow } from '@nuxt/ui'
import type { ColumnSortWithKey } from '@/types/nuxt-ui'
import * as docaiService from '@/services/docai.service'
import { activityMap } from '@/features/workspace/data/workspace.data'
import type { ActivityTableData } from '@/features/workspace/data/workspace.data'
import ActivityBrandStyleCell from '@/features/workspace/components/ActivityBrandStyleCell.vue'

export interface PendingItem {
  delete: boolean
}

export interface SelectedItem {
  activity: ActivityTableData | null
}

export interface OpenItem {
  delete: boolean
}

export function useActivity() {
  const ASYNC_KEY = {
    processor: 'workspace-processor',
    history: 'workspace-activity-history',
    historyList: 'workspace-activity-history-list',
  } as const

  const { toast } = useAppToast()
  const profileStore = useProfileStore()

  const sorting = ref<ColumnSortWithKey<ActivityTableData>[]>([
    {
      desc: true,
      id: 'finishedDate',
    },
  ])

  const open = reactive<OpenItem>({
    delete: false,
  })

  const pending = reactive<PendingItem>({
    delete: false,
  })

  const query = reactive<DocAIDTO.JobActivityHistoryQuery>({
    page: 0,
    size: 4,
    status: '',
    docType: '',
    search: '',
    sortDirection: 'DESC',
    sortBy: 'finishedDate',
  })

  const selected = reactive<SelectedItem>({
    activity: null,
  })

  const tableData = ref<ActivityTableData[]>([])

  function transformActivityData(data: DocAIDTO.JobActivityHistoryData) {
    return data.jobs.map<ActivityTableData>(o => ({
      ...o,
      pendingDownload: false,
    }))
  }

  const columnAction: TableColumn<ActivityTableData>[] = [
    {
      id: 'actions',
      cell({ row }) {
        const { fileCount, status, pendingDownload, downloadableFileCount, verificationPending } = row.original
        if (status === 'PROCESSING') return h('div')

        const releasedFiles = downloadableFileCount ?? (verificationPending ? 0 : fileCount)
        const downloadBtn
          = releasedFiles > 0 && status === 'COMPLETED'
            ? h(UButton, {
                'aria-label': 'Download available workbooks',
                variant: 'ghost', icon: pendingDownload ? 'app:loading' : 'app:file-download', color: 'neutral', size: 'lg',
                onClick() {
                  selected.activity = row.original
                  onBulkDownloadFile(row.original)
                },
              })
            : null

        const deleteBtn
          = fileCount > 0
            ? h(UButton, {
                variant: 'ghost', icon: 'lucide:trash-2', color: 'error', size: 'lg',
                onClick() {
                  open.delete = true
                  selected.activity = row.original
                },
              })
            : null

        return h('div', { class: tw`flex items-center gap-1 sm:group-hover:opacity-100 sm:opacity-0` }, [
          downloadBtn,
          deleteBtn,
        ])
      },
    },
  ]

  function useColumn(data: TableColumn<ActivityTableData>[] = columnAction) {
    return computed(() => [
      {
        accessorKey: 'formattedId',
        header: 'Processing ID',
        cell: ({ row }) => {
          const { formattedId } = row.original
          return h('div', { class: tw`flex items-center gap-4` }, [
            h(UBadge, { color: 'neutral', icon: 'app:history-process', variant: 'soft', size: 'xl' }),
            h('span', { class: tw`text-highlighted` }, formattedId),
          ])
        },
      },
      {
        accessorKey: 'brandStyles',
        header: 'Brand / Style',
        cell: ({ row }) => h(ActivityBrandStyleCell, {
          brandStyles: row.original.brandStyles,
          status: row.original.status,
        }),
      },
      {
        accessorKey: 'docType',
        header: 'Module',
        cell: ({ row }) => {
          const { docType } = row.original
          return h(UBadge, { color: 'info', label: docType, variant: 'subtle' })
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const { status, verificationPending } = row.original
          const v = verificationPending
            ? { ...activityMap.PROCESSING, label: 'Verifying your document' }
            : activityMap[status]
          return h(UBadge, { variant: 'subtle', color: v.color, label: v.label, icon: v.icon })
        },
      },
      {
        accessorKey: 'finishedDate',
        header() {
          return h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            label: 'Generated',
            icon: query.sortDirection === 'ASC'
              ? 'lucide:arrow-up-narrow-wide'
              : 'lucide:arrow-down-wide-narrow',
            onClick: () => {
              query.sortDirection = query.sortDirection === 'ASC' ? 'DESC' : 'ASC'
            },
          })
        },
        cell({ row }) {
          const { finishedDate } = row.original
          return finishedDate ? dateTimeFormatter.format(new Date(finishedDate)) : 'N/A'
        },
      },
      ...data,
    ] satisfies TableColumn<ActivityTableData>[])
  }

  function toDetail(path: string) {
    return (_: Event, row: TableRow<ActivityTableData>) => {
      navigateTo(toRoute('/workspace/activity-history', `/${row.original.jobId}?from=${path}`))
    }
  }

  async function onBulkDownloadFile(data: ActivityTableData) {
    if (!selected.activity) {
      toast.add('error', { title: 'Failed', description: 'No ID provided' })
      return
    }
    data.pendingDownload = true
    try {
      const { jobId, docType, formattedId } = selected.activity
      const { blob, filename } = await docaiService.bulkDownloadJobFiles({ companyId: profileStore.companyId, jobId })
      downloadBlob(blob, filename || `${formattedId}-${docType}`)
    }
    catch (e) {
      toast.addException(e)
    }
    finally {
      data.pendingDownload = false
    }
  }

  async function onBulkDeleteFile(fn: () => void = noop) {
    if (!selected.activity) {
      toast.add('error', { title: 'Failed', description: 'No ID provided' })
      return
    }
    pending.delete = true
    try {
      const { jobId } = selected.activity
      await docaiService.bulkDeleteJobFiles({ companyId: profileStore.companyId, jobId })
      await fn()
      open.delete = false
      toast.add('success', { title: 'Success', description: 'Successfully deleted files' })
    }
    catch (e) {
      toast.addException(e)
    }
    finally {
      pending.delete = false
    }
  }

  return {
    open,
    query,
    pending,
    sorting,
    selected,
    tableData,
    ASYNC_KEY,
    columnAction,
    toDetail,
    useColumn,
    onBulkDeleteFile,
    onBulkDownloadFile,
    transformActivityData,
  }
}

//  {
//         accessorKey: 'finishedDate',
//         sortingFn: 'datetime',
//         header({ column }) {
//           console.log(column)

//           const isSorted = column.getIsSorted()
//           return h(UButton, {
//             color: 'neutral',
//             variant: 'ghost',
//             label: 'Generated',
//             icon: isSorted
//               ? isSorted === 'asc'
//                 ? 'lucide:arrow-up-narrow-wide'
//                 : 'lucide:arrow-down-wide-narrow'
//               : 'lucide:arrow-up-down',
//             onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
//           })
//         },
//         cell({ row }) {
//           const { finishedDate } = row.original
//           return finishedDate ? dateTimeFormatter.format(new Date(finishedDate)) : 'N/A'
//         },
//       },
