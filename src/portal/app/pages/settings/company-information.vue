<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as profileService from '@/services/profile.service'
import { representativeSchema, companySchema } from '@/schema/profile.schema'
import type { IRepresentativeSchema, ICompanySchema } from '@/schema/profile.schema'
import { phoneCodes, countries, companySizes, industries } from '@/data/common.data'

const { toast } = useAppToast()
const { can } = usePermission()
const profileStore = useProfileStore()
const defaultCode = phoneCodes[0] ?? ''
const canEdit = computed(() => can(profileStore.userRole, 'company-infomation', 'update'))
const company = companyProps()
const representative = representativeProps()

function representativeProps() {
  const pending = shallowRef(false)

  const data = reactive<IRepresentativeSchema>({
    phone: '',
    email: '',
    firstName: '',
    lastName: '',
    rolePosition: '',
    code: defaultCode,
  })

  const preferredContactMethod = shallowRef('')

  const FIELD_NAME = {
    code: 'code',
    phone: 'phone',
    email: 'email',
    lastName: 'lastName',
    firstName: 'firstName',
    rolePosition: 'rolePosition',
  } satisfies IRepresentativeSchema

  const phoneNumber = computed(() => `${data.code}${data.phone}`)

  async function submit(evt: FormSubmitEvent<IRepresentativeSchema>) {
    const { code, email, firstName, lastName, phone, rolePosition } = evt.data
    try {
      pending.value = true
      const { success, reason } = await profileService.updateRepresentativeDetail({ companyId: profileStore.companyId }, {
        countryCode: code ?? '',
        workEmail: email ?? '',
        lastName: lastName ?? '',
        firstName: firstName ?? '',
        contactNumber: phone ?? '',
        rolePosition: rolePosition ?? '',
        companyId: profileStore.companyId,
        preferredContactMethod: preferredContactMethod.value,
      })
      if (success) {
        profileStore.execute()
        toast.add('success', { title: 'Success', description: 'Successfully update representative details' })
      }
      else {
        toast.add('error', { title: 'Failed', description: reason })
      }
    }
    catch (e) {
      toast.addException(e)
    }
    finally {
      pending.value = false
    }
  }

  function clear() {
    data.phone = ''
    data.email = ''
    data.lastName = ''
    data.firstName = ''
    data.rolePosition = ''
    data.code = defaultCode
  }

  return {
    data,
    phoneNumber,
    pending,
    FIELD_NAME,
    preferredContactMethod,
    clear,
    submit,
  }
}

function companyProps() {
  const pending = shallowRef(false)

  const data = reactive<ICompanySchema>({
    name: '',
    size: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    industry: '',
    code: defaultCode,
  })

  const FIELD_NAME = {
    code: 'code',
    name: 'name',
    size: 'size',
    email: 'email',
    phone: 'phone',
    address: 'address',
    country: 'country',
    industry: 'industry',
  } satisfies ICompanySchema

  const phoneNumber = computed(() => `${data.code}${data.phone}`)

  async function submit(evt: FormSubmitEvent<ICompanySchema>) {
    const { address, code, country, email, industry, name, phone, size } = evt.data
    try {
      pending.value = true
      const { success, reason } = await profileService.updateCompanyDetail({ companyId: profileStore.companyId }, {
        howDidYouHear: '',
        companyName: name ?? '',
        companySize: size ?? '',
        companyContact: phone ?? '',
        countryRegion: country ?? '',
        industryType: industry ?? '',
        companyAddress: address ?? '',
        contactCountryCode: code ?? '',
        companyEmailAddress: email ?? '',
        companyId: profileStore.companyId,
      })
      if (success) {
        profileStore.execute()
        toast.add('success', { title: 'Success', description: 'Successfully update company details' })
      }
      else {
        toast.add('error', { title: 'Failed', description: reason })
      }
    }
    catch (e) {
      toast.addException(e)
    }
    finally {
      pending.value = false
    }
  }

  return {
    data,
    phoneNumber,
    pending,
    FIELD_NAME,
    submit,
  }
}

watch(() => profileStore.data, (data) => {
  if (data) {
    const { companyDetail, representative: representativeDetail } = data

    // Representative
    if (representativeDetail) {
      representative.data.email = representativeDetail.workEmail ?? ''
      representative.data.lastName = representativeDetail.lastName ?? ''
      representative.data.code = representativeDetail.countryCode ?? ''
      representative.data.firstName = representativeDetail.firstName ?? ''
      representative.data.phone = representativeDetail.contactNumber ?? ''
      representative.data.rolePosition = representativeDetail.rolePosition ?? ''
      // TODO: confirm bug with backend
      representative.preferredContactMethod.value = representativeDetail.preferredContactMethod ?? ''
    }

    // Company
    if (companyDetail) {
      company.data.name = companyDetail.companyName ?? ''
      company.data.size = companyDetail.companySize ?? ''
      company.data.phone = companyDetail.companyContact ?? ''
      company.data.industry = companyDetail.industryType ?? ''
      company.data.country = companyDetail.countryRegion ?? ''
      company.data.address = companyDetail.companyAddress ?? ''
      company.data.code = companyDetail.contactCountryCode ?? ''
      company.data.email = companyDetail.companyEmailAddress ?? ''
    }
  }
}, { immediate: true })
</script>

<template>
  <UDashboardPanel id="company-information">
    <template #header>
      <LayoutHeader
        :to="toRoute('/settings')"
        title="Back"
      />
    </template>

    <template #body>
      <LayoutContent size="lg">
        <section class="space-y-4">
          <LayoutHeading
            title="Representative Details"
            :description="canEdit ? 'Update your representative details' : 'View representative details'"
          />
          <BaseCard>
            <UForm
              :state="representative.data"
              :schema="representativeSchema"
              class="space-y-8"
              @submit="representative.submit"
            >
              <fieldset :disabled="!canEdit">
                <section class="grid md:grid-cols-2 gap-4">
                  <UFormField
                    :name="representative.FIELD_NAME.firstName"
                    label="First Name"
                  >
                    <UInput
                      v-model="representative.data.firstName"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    :name="representative.FIELD_NAME.lastName"
                    label="Last Name"
                  >
                    <UInput
                      v-model="representative.data.lastName"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    :name="representative.FIELD_NAME.rolePosition"
                    label="Role/Position"
                  >
                    <UInput
                      v-model="representative.data.rolePosition"
                      class="w-full"
                    />
                  </UFormField>

                  <UFormField
                    :name="representative.FIELD_NAME.email"
                    label="Email Address"
                  >
                    <UInput
                      v-model="representative.data.email"
                      class="w-full"
                    />
                  </UFormField>

                  <InputPhoneNumber
                    v-model:phone="representative.data.phone"
                    v-model:phone-code="representative.data.code"
                    label="Phone Number"
                    :options="phoneCodes"
                    :name="{
                      phone: representative.FIELD_NAME.phone,
                      phoneCode: representative.FIELD_NAME.code,
                    }"
                  />
                </section>

                <footer v-if="canEdit" class="text-right flex justify-end gap-2 mt-8">
                  <UButton
                    :loading="representative.pending.value"
                    type="submit"
                    label="Save Change"
                  />
                </footer>
              </fieldset>
            </UForm>
          </BaseCard>
        </section>

        <section class="space-y-4">
          <LayoutHeading
            title="Company Details"
            :description="canEdit ? 'Update your company details' : 'View company details'"
          />
          <BaseCard>
            <UForm
              :state="company.data"
              :schema="companySchema"
              class="space-y-8"
              @submit="company.submit"
            >
              <fieldset :disabled="!canEdit">
                <main class="space-y-4">
                  <section class="grid md:grid-cols-2 gap-4">
                    <UFormField
                      :name="company.FIELD_NAME.name"
                      label="Company Name"
                    >
                      <UInput
                        v-model="company.data.name"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      :name="company.FIELD_NAME.email"
                      label="Company Email Address"
                    >
                      <UInput
                        v-model="company.data.email"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField
                      :name="company.FIELD_NAME.industry"
                      label="Industry Type"
                    >
                      <USelectMenu
                        v-model="company.data.industry"
                        class="w-full"
                        :items="industries"
                        value-key="value"
                      >
                        <template #empty>
                          No Data
                        </template>
                      </USelectMenu>
                    </UFormField>

                    <UFormField
                      :name="company.FIELD_NAME.size"
                      label="Company Size"
                    >
                      <USelectMenu
                        v-model="company.data.size"
                        class="w-full"
                        :items="companySizes"
                        value-key="value"
                      >
                        <template #empty>
                          No Data
                        </template>
                      </USelectMenu>
                    </UFormField>

                    <UFormField
                      :name="company.FIELD_NAME.country"
                      label="Country / Region"
                    >
                      <USelectMenu
                        v-model="company.data.country"
                        class="w-full"
                        :items="countries"
                        value-key="label"
                        virtualize
                      >
                        <template #empty>
                          No Data
                        </template>
                      </USelectMenu>
                    </UFormField>

                    <InputPhoneNumber
                      v-model:phone="company.data.phone"
                      v-model:phone-code="company.data.code"
                      label="Company Contact"
                      :options="phoneCodes"
                      :name="{
                        phone: company.FIELD_NAME.phone,
                        phoneCode: company.FIELD_NAME.code,
                      }"
                    />
                  </section>

                  <UFormField
                    :name="company.FIELD_NAME.address"
                    label="Company Address"
                  >
                    <UTextarea
                      v-model="company.data.address"
                      class="w-full"
                    />
                  </UFormField>
                </main>

                <footer v-if="canEdit" class="text-right flex justify-end gap-2 mt-8">
                  <UButton
                    type="submit"
                    label="Save Change"
                    :loading="company.pending.value"
                  />
                </footer>
              </fieldset>
            </UForm>
          </BaseCard>
        </section>
      </LayoutContent>
    </template>
  </UDashboardPanel>
</template>
