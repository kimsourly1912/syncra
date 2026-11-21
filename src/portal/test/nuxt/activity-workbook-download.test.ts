import { afterEach, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { useActivity } from '../../app/features/workspace/composables/useActivity'
import type { ActivityTableData } from '../../app/features/workspace/data/workspace.data'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

it('shows bulk download only when there are released workbooks', async () => {
  const job: ActivityTableData = {
    jobId: 236,
    formattedId: 'PID-0174',
    fileCount: 2,
    status: 'COMPLETED',
    docType: 'TECHPACK',
    verificationPending: true,
    downloadableFileCount: 0,
    pendingDownload: false,
  }
  const Host = defineComponent({
    props: {
      job: { type: Object as PropType<ActivityTableData>, required: true },
    },
    setup(props) {
      const cell = useActivity().columnAction[0]!.cell
      if (typeof cell !== 'function')
        throw new Error('Expected an activity action renderer')
      return () => cell({ row: { original: props.job } } as Parameters<typeof cell>[0])
    },
  })
  wrapper = await mountSuspended(Host, { props: { job } })
  const download = '[aria-label="Download available workbooks"]'

  expect(wrapper.find(download).exists()).toBe(false)
  await wrapper.setProps({ job: { ...job, downloadableFileCount: 1 } })
  expect(wrapper.find(download).exists()).toBe(true)
  await wrapper.setProps({ job: { ...job, downloadableFileCount: undefined } })
  expect(wrapper.find(download).exists()).toBe(false)
  await wrapper.setProps({ job: { ...job, verificationPending: false, downloadableFileCount: undefined } })
  expect(wrapper.find(download).exists()).toBe(true)
})
