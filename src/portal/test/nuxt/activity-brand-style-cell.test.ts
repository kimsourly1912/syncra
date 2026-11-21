import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import ActivityBrandStyleCell from '../../app/features/workspace/components/ActivityBrandStyleCell.vue'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('activity Brand / Style cell', () => {
  it('shows N/A for processing and empty jobs', async () => {
    wrapper = await mountSuspended(ActivityBrandStyleCell, {
      props: { status: 'PROCESSING', brandStyles: [{ brand: 'Brand', style: 'S1' }] },
    })
    expect(wrapper.text()).toBe('N/A')
    expect(wrapper.find('button').exists()).toBe(false)
    await wrapper.setProps({ status: 'COMPLETED', brandStyles: [] })
    expect(wrapper.text()).toBe('N/A')
  })

  it('shows a rejected brand with N/A for the missing style', async () => {
    wrapper = await mountSuspended(ActivityBrandStyleCell, {
      props: { status: 'REJECTED', brandStyles: [{ brand: 'Brand', style: null }] },
    })
    expect(wrapper.text()).toBe('Brand / N/A')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('opens all unique pairs without selecting the row and closes with Escape', async () => {
    const selectRow = vi.fn()
    const Host = defineComponent({
      setup: () => () => h('div', { onClick: selectRow }, [
        h(ActivityBrandStyleCell, {
          status: 'COMPLETED',
          brandStyles: [
            { brand: 'Brand', style: 'S1' },
            { brand: 'Brand', style: 'S1' },
            { brand: 'Brand', style: 'S2' },
            { brand: 'Other', style: null },
          ],
        }),
      ]),
    })
    wrapper = await mountSuspended(Host, { attachTo: document.body })
    expect(wrapper.find('button').text()).toBe('+2 more')
    await wrapper.find('button').trigger('click')
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())
    const list = document.querySelector('[aria-label="All Brand and Style pairs"]')!
    expect(list.querySelectorAll('li')).toHaveLength(3)
    expect(list.textContent).toContain('S1')
    expect(list.textContent).toContain('S2')
    expect(list.textContent).toContain('N/A')
    expect(selectRow).not.toHaveBeenCalled()
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull())
    expect(selectRow).not.toHaveBeenCalled()
  })

  it('closes the pair list when clicking outside', async () => {
    wrapper = await mountSuspended(ActivityBrandStyleCell, {
      props: {
        status: 'COMPLETED',
        brandStyles: [{ brand: 'Brand', style: 'S1' }, { brand: 'Brand', style: 'S2' }],
      },
      attachTo: document.body,
    })
    await wrapper.find('button').trigger('click')
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull())
  })
})
