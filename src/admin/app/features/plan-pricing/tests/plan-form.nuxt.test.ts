import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useState } from '#imports'
import PlanEditScreen from '../components/PlanEditScreen.vue'
import PlanFormScreen from '../components/PlanFormScreen.vue'
import { findSamplePlan } from '../fixtures/plans'

const mounted: { unmount: () => void }[] = []
afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})
beforeEach(() => {
  useState('session:status').value = 'signed-in'
  useState('session:staff').value = { id: 1, email: 'staff@example.test' }
})

async function mount(component: Parameters<typeof mountSuspended>[0], props: Record<string, unknown> = {}) {
  const wrapper = await mountSuspended(component, { props })
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

const button = (wrapper: Awaited<ReturnType<typeof mount>>, label: string) => wrapper.findAll('button').find(item => item.attributes('aria-label') === label || item.text() === label)

describe('plan form', () => {
  it('edits a plan: prefilled with its key features, and discards changes', async () => {
    const plan = findSamplePlan('001')!
    const wrapper = await mount(PlanFormScreen, { plan })

    expect(wrapper.text()).toContain('Edit plan')
    const features = wrapper.findAll('input[id^="plan-feature-"]')
    expect(features.map(input => (input.element as HTMLInputElement).value)).toEqual(plan.features)

    await features[0]!.setValue('Changed feature')
    expect(wrapper.text()).toContain('Unsaved changes')

    await button(wrapper, 'Discard changes')!.trigger('click')
    const after = wrapper.findAll('input[id^="plan-feature-"]')
    expect(after.map(input => (input.element as HTMLInputElement).value)).toEqual(plan.features)
    expect(wrapper.text()).not.toContain('Unsaved changes')
  })
})

describe('plan edit screen', () => {
  it('opens the sample plan for its id', async () => {
    const wrapper = await mount(PlanEditScreen, { id: '001' })

    expect(wrapper.text()).toContain('Edit plan')
    expect(wrapper.findAll('input[id^="plan-feature-"]')).toHaveLength(findSamplePlan('001')!.features.length)
  })

  it('says Not found for an id that is not a plan', async () => {
    const wrapper = await mount(PlanEditScreen, { id: 'missing' })

    expect(wrapper.text()).toContain('Plan not found')
    expect(wrapper.text()).not.toContain('Edit plan')
  })
})
