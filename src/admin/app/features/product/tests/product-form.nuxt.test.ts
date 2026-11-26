import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useState } from '#imports'
import ProductEditScreen from '../components/ProductEditScreen.vue'
import ProductFormScreen from '../components/ProductFormScreen.vue'
import { findSampleProduct } from '../fixtures/products'

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

describe('product edit screen', () => {
  it('opens the sample product for its id', async () => {
    const wrapper = await mount(ProductEditScreen, { id: '000' })

    expect(wrapper.text()).toContain('Edit product')
    expect((wrapper.find('input[placeholder="e.g. Doc AI"]').element as HTMLInputElement).value).toBe(findSampleProduct('000')!.name)
  })

  it('says Not found for an id that is not a product', async () => {
    const wrapper = await mount(ProductEditScreen, { id: 'missing' })

    expect(wrapper.text()).toContain('Product not found')
    expect(wrapper.find('input[placeholder="e.g. Doc AI"]').exists()).toBe(false)
  })
})
