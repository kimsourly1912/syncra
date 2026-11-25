import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useState } from '#imports'
import EmailTemplateSettings from '../../app/features/settings/components/EmailTemplateSettings.vue'
import ProfileSettings from '../../app/features/settings/components/ProfileSettings.vue'
import StaffAccessSettings from '../../app/features/settings/components/StaffAccessSettings.vue'
import TokenPackageSettings from '../../app/features/settings/components/TokenPackageSettings.vue'
import { fakeApi, ok } from '../fake-api'

const route = reactive({ query: {} as Record<string, string>, params: {}, path: '/setting' })
mockNuxtImport('useRoute', () => () => route)

// Sanitized fixtures shaped like the Admin settings endpoints.
const profile = { id: 1, username: 'Test Staff', email: 'staff@example.test', logoUrl: null, role: { name: 'Super Admin' }, userStatus: 'CONFIRMED' }
const template = { name: 'welcome_email', subject: 'Welcome to Syncra', html: '<p>Hello</p>', text: 'Hello' }
const packages = [
  { id: 2, code: 'LARGE', name: 'Large pack', tokenAmount: 5000, price: 40, currency: 'USD', expiryDays: 365, sortOrder: 2 },
  { id: 1, code: 'SMALL', name: 'Small pack', tokenAmount: 1000, price: 10, currency: 'USD', expiryDays: 30, sortOrder: 1 },
]

const mounted: { unmount: () => void }[] = []
afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})
beforeEach(() => {
  clearNuxtData()
  // Signed in, so the route guard doesn't load a profile; each test sets the staff it needs.
  useState('session:status').value = 'signed-in'
  useState('session:staff').value = profile
  route.query = {}
})

async function mount(component: Parameters<typeof mountSuspended>[0]) {
  const wrapper = await mountSuspended(component)
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

describe('profile settings', () => {
  it('shows the signed-in profile and saves a new display name, then reloads the session', async () => {
    const { transport } = fakeApi({
      'POST /admin/users/me/profile': ok({ ...profile, username: 'New Name' }),
      'GET /admin/users/me/profile': ok({ ...profile, username: 'New Name' }),
    })
    const wrapper = await mount(ProfileSettings)

    expect(wrapper.text()).toContain('staff@example.test')
    expect(wrapper.text()).toContain('Super Admin')
    expect(wrapper.text()).toContain('Active')

    await wrapper.find('input[autocomplete="name"]').setValue('New Name')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(transport).toHaveBeenCalledWith('/admin/users/me/profile', expect.objectContaining({ method: 'POST', body: { username: 'New Name' } }))
    expect(transport).toHaveBeenCalledWith('/admin/users/me/profile', expect.objectContaining({ method: 'GET' }))
  })
})

describe('email template settings', () => {
  it('lists templates and opens one read-only from the URL', async () => {
    route.query = { template: 'welcome_email' }
    fakeApi({
      'GET /admin/email-templates': ok([template]),
      'GET /admin/email-templates/welcome_email': ok(template),
    })
    const wrapper = await mount(EmailTemplateSettings)

    expect(wrapper.text()).toContain('welcome_email')
    expect(wrapper.text()).toContain('Welcome to Syncra')
    const frame = document.querySelector('iframe[title="Email preview"]')
    expect(frame?.getAttribute('sandbox')).toBe('')
    expect(wrapper.text()).toContain('Editing templates isn\'t available in Admin yet.')
  })
})

describe('token package settings', () => {
  it('lists packages in their sort order with tokens, price, and expiry', async () => {
    fakeApi({ 'GET /admin/credits/packages': ok(packages) })
    const wrapper = await mount(TokenPackageSettings)

    const text = wrapper.text()
    expect(text.indexOf('Small pack')).toBeLessThan(text.indexOf('Large pack'))
    expect(text).toContain('5,000')
    expect(text).toContain('365 days')
  })
})

describe('staff access settings', () => {
  it('validates only on submit, not on blur or input', async () => {
    fakeApi({})
    const wrapper = await mount(StaffAccessSettings)

    const password = wrapper.findAll('input[autocomplete="new-password"]')[0]!
    await password.setValue('weak')
    await password.trigger('blur')
    await password.setValue('weaker')
    await new Promise(resolve => setTimeout(resolve, 400)) // past UForm's input debounce
    await flushPromises()
    expect(wrapper.text()).not.toContain('Password too weak')

    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Password too weak')
  })

  it('won\'t send an invite with a weak password', async () => {
    const { transport } = fakeApi({})
    const wrapper = await mount(StaffAccessSettings)

    await wrapper.find('input[type="email"]').setValue('new@example.test')
    const passwords = wrapper.findAll('input[autocomplete="new-password"]')
    await passwords[0]!.setValue('weak')
    await passwords[1]!.setValue('weak')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(transport).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Password too weak')
  })

  it('sends an invite with a valid password', async () => {
    const { transport } = fakeApi({ 'POST /admin/users/invite': ok({ email: 'new@example.test', userStatus: 'FORCE_CHANGE_PASSWORD' }) })
    const wrapper = await mount(StaffAccessSettings)

    await wrapper.find('input[type="email"]').setValue('new@example.test')
    const passwords = wrapper.findAll('input[autocomplete="new-password"]')
    await passwords[0]!.setValue('Sample-Passw0rd')
    await passwords[1]!.setValue('Sample-Passw0rd')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(transport).toHaveBeenCalledWith('/admin/users/invite', expect.objectContaining({
      method: 'POST',
      body: { email: 'new@example.test', tempPassword: 'Sample-Passw0rd', confirmPassword: 'Sample-Passw0rd' },
    }))
  })

  it('asks before disabling an account, and checks the email first', async () => {
    const { transport } = fakeApi({ 'POST /admin/users/disable': ok({}) })
    const wrapper = await mount(StaffAccessSettings)
    const disable = () => wrapper.findAll('button').find(button => button.text() === 'Disable sign-in')!

    await disable().trigger('click')
    expect(wrapper.text()).toContain('This field is required')

    const emails = wrapper.findAll('input[type="email"]')
    await emails[1]!.setValue('old@example.test')
    await disable().trigger('click')
    await flushPromises()
    expect(transport).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('old@example.test won\'t be able to sign in')
  })
})
