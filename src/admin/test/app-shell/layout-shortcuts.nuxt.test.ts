import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { useRouter, useState } from '#imports'
import { UApp } from '#components'
import DefaultLayout from '@/layouts/default.vue'

const mounted: { unmount: () => void }[] = []
afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})
beforeEach(() => {
  useState('session:status').value = 'signed-in'
  useState('session:staff').value = { id: 1, email: 'staff@example.test', username: 'Test Staff' }
})

async function mount() {
  // Inside UApp, as in the app: the collapsed sidebar's tooltips need its provider.
  const wrapper = await mountSuspended(defineComponent(() => () => h(UApp, null, () => h(DefaultLayout, null, () => 'Page'))))
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

async function press(key: string, init: KeyboardEventInit = {}) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }))
  await flushPromises()
}

describe('layout shortcuts', () => {
  it('opens the shortcuts list with ?', async () => {
    await mount()
    expect(document.body.textContent).not.toContain('Show or hide the sidebar')

    await press('?', { shiftKey: true })

    expect(document.body.textContent).toContain('Keyboard shortcuts')
    expect(document.body.textContent).toContain('Show or hide the sidebar')
  })

  it('collapses and expands the sidebar with Ctrl+B on a wide screen', async () => {
    // The test window is 1024px (`lg`), so Ctrl+B collapses the sidebar; `meta` is Ctrl off a Mac.
    const wrapper = await mount()
    const logo = () => wrapper.find('img[alt="Syncra"]').exists()
    expect(logo()).toBe(true)

    await press('b', { ctrlKey: true })
    expect(logo()).toBe(false)

    await press('b', { ctrlKey: true })
    expect(logo()).toBe(true)
  })

  it('leaves Ctrl+B alone while typing in a field', async () => {
    const wrapper = await mount()
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true }))
    await flushPromises()

    expect(wrapper.find('img[alt="Syncra"]').exists()).toBe(true)
    input.remove()
  })
})

describe('page names', () => {
  it('gives every page without params a title, which its sidebar link shows', async () => {
    const router = useRouter()
    const untitled = router.getRoutes().filter(page => !page.path.includes(':') && !page.meta.title).map(page => page.path)
    expect(untitled).toEqual([])

    const wrapper = await mount()
    const links = wrapper.findAll('nav a').map(link => link.text().trim()).filter(Boolean)
    expect(links).toEqual(expect.arrayContaining(['Account management', 'TechPack reviews', 'Lead inquiries', 'Settings']))
  })
})
