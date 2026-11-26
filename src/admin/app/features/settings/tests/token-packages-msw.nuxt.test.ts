import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useState } from '#imports'
import TokenPackageSettings from '../components/TokenPackageSettings.vue'
import { ok, refused } from '#test/fake-api'
import { useMswApi } from '#test/msw'
import type { Api } from '@/api'

// Pilot of the generated MSW handlers (decision 0021): the same screen as settings.nuxt.test.ts,
// with the request sent by the real $fetch and answered by MSW.
const api = useMswApi()

const packages = [
  { id: 2, code: 'LARGE', name: 'Large pack', tokenAmount: 5000, price: 40, currency: 'USD', expiryDays: 365, sortOrder: 2 },
  { id: 1, code: 'SMALL', name: 'Small pack', tokenAmount: 1000, price: 10, currency: 'USD', expiryDays: 30, sortOrder: 1 },
] satisfies Api.CreditPackageDto[]

const mounted: { unmount: () => void }[] = []
afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})
beforeEach(() => {
  clearNuxtData()
  useState('session:status').value = 'signed-in'
})

async function mount() {
  const wrapper = await mountSuspended(TokenPackageSettings)
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

describe('token packages over the network (MSW)', () => {
  it('lists packages in their sort order', async () => {
    api.server.use(api.handlers.getPackages1({ body: ok(packages) }))
    const wrapper = await mount()

    const text = wrapper.text()
    expect(text.indexOf('Small pack')).toBeLessThan(text.indexOf('Large pack'))
    expect(text).toContain('5,000')
  })

  it('shows the API reason when it refuses', async () => {
    api.server.use(api.handlers.getPackages1({ body: refused('Packages are being updated.') }))
    const wrapper = await mount()

    expect(wrapper.text()).toContain('Packages are being updated.')
  })
})
