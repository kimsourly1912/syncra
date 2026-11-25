<script setup lang="ts">
import { useObjectUrl } from '@vueuse/core'
import type { ProfileDTO } from '@/types/dto'
import type { FormSubmitEvent } from '@nuxt/ui'
import { ACCEPTED_IMAGE_TYPES } from '~/constants/app'
import type { ObjectValueToString } from '~/types/common'
import * as profileService from '@/services/profile.service'
import { changePasswordSchema, profileDetailSchema } from '@/schema/profile.schema'
import type { IChangePasswordSchema, IProfileDetailSchema } from '@/schema/profile.schema'

const { toast } = useAppToast()
const profileStore = useProfileStore()
const profileDetail = profileDetailProps()
const changePassword = changePasswordProps()

const jobTitleItems = ref(['QA/QC', 'Merchandiser', 'Product Developer'])

const acceptedImageType = computed(() => ACCEPTED_IMAGE_TYPES.join(','))

function profileDetailProps() {
  const data = reactive<IProfileDetailSchema>({
    avatar: undefined,
    firstName: '',
    lastName: '',
    jobTitle: '',
  })

  const preview = shallowRef('')
  const pending = shallowRef(false)

  const FIELD_NAME = {
    avatar: 'avatar',
    lastName: 'lastName',
    firstName: 'firstName',
    jobTitle: 'jobTitle',
  } satisfies ObjectValueToString<IProfileDetailSchema>

  function createJobTitle(data: string) {
    jobTitleItems.value.push(data)
  }

  async function updateProfile(req: ProfileDTO.UpdateProfileReq) {
    try {
      const { success, reason } = await profileService.updateProfile(req)
      if (!success) {
        toast.add('error', { title: 'Failed', description: reason })
      }
    }
    catch (e) {
      toast.addException(e)
    }
  }

  async function uploadAvatar() {
    try {
      const formData = new FormData()
      formData.append('file', data.avatar!)
      const { success, reason, data: _data } = await profileService.uploadAvatar(formData)
      if (success) {
        data.avatar = undefined
      }
      else {
        toast.add('error', { title: 'Failed', description: reason })
      }
    }
    catch (e) {
      toast.addException(e)
    }
  }

  async function removeAvatar() {
    try {
      const { success, reason } = await profileService.removeAvatar()
      if (!success) {
        toast.add('error', { title: 'Failed', description: reason })
      }
    }
    catch (e) {
      toast.addException(e)
    }
  }

  async function runInParallel() {
    try {
      pending.value = true
      await Promise.all([
        updateProfile({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          jobTitle: data.jobTitle ?? '',
        }),
        preview.value ? data.avatar && uploadAvatar() : !data.avatar && removeAvatar(),
      ])
      profileStore.execute()
      toast.add('success', { title: 'Success', description: 'Successfully update profile detail' })
    }
    catch (e) {
      toast.addException(e)
    }
    finally {
      pending.value = false
    }
  }

  function submit(_: FormSubmitEvent<IProfileDetailSchema>) {
    runInParallel()
  }

  function clearAll() {
    data.avatar = undefined
    data.lastName = ''
    data.firstName = ''
    data.jobTitle = ''
  }

  function removeFile() {
    preview.value = ''
    data.avatar = undefined
  }

  watch(() => data.avatar, (avatar) => {
    if (avatar) {
      preview.value = useObjectUrl(avatar).value ?? ''
    }
  })

  return {
    data,
    preview,
    pending,
    FIELD_NAME,
    submit,
    clearAll,
    removeFile,
    uploadAvatar,
    updateProfile,
    createJobTitle,
  }
}

function changePasswordProps() {
  const data = reactive<IChangePasswordSchema>({
    newPassword: '',
    confirmPassword: '',
    currentPassword: '',
  })

  const FIELD_NAME = {
    newPassword: 'newPassword',
    confirmPassword: 'confirmPassword',
    currentPassword: 'currentPassword',
  } satisfies IChangePasswordSchema

  const { execute, pending } = useAsyncData(() => changePassword({
    newPassword: data.newPassword,
    oldPassword: data.currentPassword,
    confirmPassword: data.confirmPassword,
  }), { immediate: false })

  async function changePassword(req: ProfileDTO.ChangePasswordReq) {
    try {
      const { success, reason } = await profileService.changePassword(req)
      if (success) {
        clearAll()
        toast.add('success', { title: 'Success', description: 'Successfully update password' })
      }
      else {
        toast.add('error', { title: 'Failed', description: reason })
      }
    }
    catch (e) {
      toast.addException(e)
    }
  }

  function submit(_: FormSubmitEvent<IChangePasswordSchema>) {
    execute()
  }

  function clearAll() {
    data.newPassword = ''
    data.confirmPassword = ''
    data.currentPassword = ''
  }

  return {
    data,
    FIELD_NAME,
    pending,
    execute,
    submit,
    clearAll,
    changePassword,
  }
}

watch(() => profileStore.data, (data) => {
  if (data) {
    profileDetail.data.firstName = data.firstName ?? ''
    profileDetail.data.lastName = data.lastName ?? ''
    profileDetail.preview.value = data.logoUrl ?? ''

    const found = jobTitleItems.value.find(o => o === data.jobTitle)
    if (!found) {
      jobTitleItems.value.push(data.jobTitle)
    }
    profileDetail.data.jobTitle = data.jobTitle ?? ''
  }
}, { immediate: true })
</script>

<template>
  <UDashboardPanel id="account-profile">
    <template #header>
      <LayoutHeader
        :to="toRoute('/settings')"
        title="Back"
      />
    </template>

    <template #body>
      <LayoutContent size="lg">
        <LayoutHeading
          title="Account Profile"
          description="Manage your account profile and security"
        />

        <section class="space-y-4">
          <LayoutHeading
            title="Profile Detail"
          />
          <BaseCard>
            <UForm
              :state="profileDetail.data"
              :schema="profileDetailSchema"
              class="space-y-6"
              :validate-on="[]"
              @submit="profileDetail.submit"
            >
              <UFormField
                label="Avatar"
                :name="profileDetail.FIELD_NAME.avatar"
                description="JPG, GIF or PNG. 2MB Max."
              >
                <section class="flex items-center gap-4">
                  <UFileUpload
                    v-model="profileDetail.data.avatar"
                    highlight
                    size="xl"
                    :accept="acceptedImageType"
                  >
                    <template #default="{ open }">
                      <section class="relative">
                        <button
                          type="button"
                          class="cursor-pointer flex border border-dashed border-accented items-center justify-center size-24 bg-accented rounded-full overflow-hidden"
                          @click="open()"
                        >
                          <template v-if="profileDetail.preview.value">
                            <NuxtImg
                              class="size-full object-cover"
                              :src="profileDetail.preview.value"
                            />
                          </template>
                          <template v-else>
                            <UBadge
                              icon="lucide:camera"
                              color="neutral"
                              variant="soft"
                              size="xl"
                            />
                          </template>
                        </button>

                        <div
                          v-if="profileDetail.data.avatar || profileDetail.preview.value"
                          class="bg-inverted text-inverted absolute top-0 right-0 size-5 rounded-full flex items-center justify-center cursor-pointer"
                          @click.prevent="profileDetail.removeFile"
                        >
                          <UIcon name="lucide:x" />
                        </div>
                      </section>
                    </template>
                  </UFileUpload>
                </section>
              </UFormField>

              <section class="grid sm:grid-cols-2 gap-4">
                <UFormField
                  label="First Name"
                  :name="profileDetail.FIELD_NAME.firstName"
                >
                  <UInput
                    v-model="profileDetail.data.firstName"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Last Name"
                  :name="profileDetail.FIELD_NAME.lastName"
                >
                  <UInput
                    v-model="profileDetail.data.lastName"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Email Address"
                  help="This email is linked to your login credential and cannot be changed"
                >
                  <UInput
                    class="w-full"
                    disabled
                    :model-value="profileStore.data?.email"
                    trailing-icon="lucide:lock"
                  />
                </UFormField>

                <UFormField
                  label="Job Title"
                  :name="profileDetail.FIELD_NAME.jobTitle"
                >
                  <USelectMenu
                    v-model.trim="profileDetail.data.jobTitle"
                    class="w-full"
                    :items="jobTitleItems"
                    clear
                    create-item
                    :search-input="{
                      placeholder: 'Create or search...',
                    }"
                    @create="profileDetail.createJobTitle"
                  />
                </UFormField>

                <UFormField label="Role">
                  <UInput
                    class="w-full"
                    disabled
                    :model-value="profileStore.data?.roleName"
                    trailing-icon="lucide:lock"
                  />
                </UFormField>
              </section>

              <footer class="flex justify-end">
                <UButton
                  label="Save Change"
                  type="submit"
                  :loading="profileDetail.pending.value"
                />
              </footer>
            </UForm>
          </BaseCard>
        </section>

        <section class="space-y-4">
          <LayoutHeading
            title="Security"
          />
          <BaseCard>
            <UForm
              :state="changePassword.data"
              :schema="changePasswordSchema"
              class="space-y-6"
              :validate-on="[]"
              @submit="changePassword.submit"
            >
              <UFormField
                label="Current Password"
                required
                :name="changePassword.FIELD_NAME.currentPassword"
              >
                <InputPassword
                  v-model="changePassword.data.currentPassword"
                  class="w-full"
                />
              </UFormField>

              <section class="space-y-2">
                <UFormField
                  label="New Password"
                  required
                  :name="changePassword.FIELD_NAME.newPassword"
                >
                  <InputPassword
                    v-model="changePassword.data.newPassword"
                    class="w-full"
                  />
                </UFormField>
                <PasswordSuggestionMessage :value="changePassword.data.newPassword" />
              </section>

              <UFormField
                label="Confirm New Password"
                required
                :name="changePassword.FIELD_NAME.confirmPassword"
              >
                <InputPassword
                  v-model="changePassword.data.confirmPassword"
                  class="w-full"
                />
              </UFormField>

              <footer class="flex justify-end">
                <UButton
                  label="Save Change"
                  type="submit"
                  :loading="changePassword.pending.value"
                />
              </footer>
            </UForm>
          </BaseCard>
        </section>
      </LayoutContent>
    </template>
  </UDashboardPanel>
</template>
