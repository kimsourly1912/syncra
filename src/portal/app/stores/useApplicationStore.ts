import { STORE_ID } from '@/constants/key'

interface CollapsedItem {
  sidebar: boolean
}

interface UseApplicationStoreOptions {
  to?: string
  title?: string
  collapsed?: CollapsedItem
}

export const useApplicationStore = defineStore(STORE_ID.layout, () => {
  const to = shallowRef('')
  const title = shallowRef('')
  const collapsed = reactive<CollapsedItem>({
    sidebar: false,
  })

  const pending = shallowRef(false)

  function defineOptions(options: UseApplicationStoreOptions = {}) {
    const {
      to: _to = '',
      title: _title = '',
      collapsed: _collapsed = {
        sidebar: false,
      },
    } = options

    to.value = _to
    title.value = _title

    Object.entries(_collapsed).forEach(([key, value]) => {
      collapsed[key as keyof CollapsedItem] = value
    })
  }

  defineShortcuts({
    ctrl_b: () => {
      collapsed.sidebar = !collapsed.sidebar
    },
  })

  return {
    pending,
    collapsed,
    defineOptions,
  }
})
