import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useState } from '#imports'
import PlanFormScreen from '../../app/features/plan-pricing/components/PlanFormScreen.vue'
import { findSamplePlan } from '../../app/features/plan-pricing/fixtures/plans'
import ProductFormScreen from '../../app/features/product/components/ProductFormScreen.vue'
import { findSampleProduct } from '../../app/features/product/fixtures/products'

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

describe('product form', () => {
  it('starts empty for a new product, with Create disabled', async () => {
    const wrapper = await mount(ProductFormScreen)

    expect(wrapper.text()).toContain('New product')
    expect(button(wrapper, 'Create product')?.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).not.toContain('Danger zone')
  })

  it('edits a product: prefilled, tracks unsaved changes, and discards them', async () => {
    const product = findSampleProduct('000')!
    const wrapper = await mount(ProductFormScreen, { product })

    expect(wrapper.text()).toContain('Edit product')
    const name = wrapper.find('input[placeholder="e.g. Doc AI"]')
    expect((name.element as HTMLInputElement).value).toBe(product.name)
    expect(wrapper.text()).not.toContain('Unsaved changes')

    await name.setValue('Renamed product')
    expect(wrapper.text()).toContain('Unsaved changes')

    await button(wrapper, 'Discard changes')!.trigger('click')
    expect((name.element as HTMLInputElement).value).toBe(product.name)
    expect(wrapper.text()).not.toContain('Unsaved changes')

    expect(button(wrapper, 'Save changes')?.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Danger zone')
    expect(button(wrapper, 'Delete')?.attributes('disabled')).toBeDefined()
  })
})

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
