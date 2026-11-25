<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useProfileSettings } from '../composables/useProfileSettings'
import { profileSchema } from '../schemas/profile-form'
import type { IProfileSchema } from '../schemas/profile-form'

const { profile, renaming, uploading, removing, saveName, saveLogo, deleteLogo } = useProfileSettings()

const FIELD_NAME = { username: 'username' } satisfies { [K in keyof IProfileSchema]: K }
const state = reactive({ username: profile.value?.username ?? '' })
// A reload after saving brings the saved name back from the API.
watch(() => profile.value?.username, (name) => {
  state.username = name ?? ''
})
const changed = computed(() => state.username.trim() !== (profile.value?.username ?? ''))

const STATUS: Record<string, { label: string, color: 'success' | 'warning' | 'error' | 'neutral' }> = {
  CONFIRMED: { label: 'Active', color: 'success' },
  UNCONFIRMED: { label: 'Unconfirmed', color: 'warning' },
  FORCE_CHANGE_PASSWORD: { label: 'Must change password', color: 'warning' },
  RESET_REQUIRED: { label: 'Password reset required', color: 'warning' },
  COMPROMISED: { label: 'Compromised', color: 'error' },
  ARCHIVED: { label: 'Archived', color: 'neutral' },
  UNKNOWN: { label: 'Unknown', color: 'neutral' },
}
const status = computed(() => (profile.value?.userStatus ? STATUS[profile.value.userStatus] : undefined))

// The logo saves as soon as it's chosen; the API checks the file and says why if it refuses it.
const logo = ref<File | null>(null)
watch(logo, async (file) => {
  if (!file) return
  await saveLogo(file)
  logo.value = null
})

function onSubmit(event: FormSubmitEvent<IProfileSchema>) {
  return saveName(event.data)
}
</script>

<template>
  <div class="space-y-6">
    <UPageCard
      title="Logo"
      description="Shown with your name in Admin."
      variant="outline"
    >
      <div class="flex flex-wrap items-center gap-4">
        <UAvatar
          :src="profile?.logoUrl ?? undefined"
          :alt="profile?.username || profile?.email || 'Staff member'"
          size="3xl"
        />
        <UFileUpload
          v-slot="{ open }"
          v-model="logo"
          accept="image/*"
        >
          <div class="flex flex-wrap gap-2">
            <UButton
              :label="profile?.logoUrl ? 'Replace' : 'Upload logo'"
              icon="lucide:upload"
              color="neutral"
              variant="outline"
              :loading="uploading"
              :disabled="removing"
              @click="open()"
            />
            <UButton
              v-if="profile?.logoUrl"
              label="Remove"
              color="error"
              variant="ghost"
              :loading="removing"
              :disabled="uploading"
              @click="deleteLogo"
            />
          </div>
        </UFileUpload>
      </div>
    </UPageCard>

    <UPageCard
      title="Profile"
      description="Your own staff account."
      variant="outline"
    >
      <UForm
        :schema="profileSchema"
        :state
        :disabled="renaming"
        class="space-y-5"
        :validate-on="[]"
        @submit="onSubmit"
      >
        <UFormField
          label="Display name"
          :name="FIELD_NAME.username"
        >
          <UInput
            v-model="state.username"
            autocomplete="name"
            class="w-full"
          />
        </UFormField>

        <dl class="grid gap-4 sm:grid-cols-2">
          <div class="min-w-0">
            <dt class="text-sm text-muted">
              Sign-in email
            </dt>
            <dd class="mt-0.5 wrap-anywhere text-highlighted">
              {{ profile?.email || '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Role
            </dt>
            <dd class="mt-0.5 text-highlighted">
              {{ profile?.role?.name || '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Account status
            </dt>
            <dd class="mt-1">
              <UBadge
                v-if="status"
                :label="status.label"
                :color="status.color"
                variant="subtle"
              />
              <template v-else>
                —
              </template>
            </dd>
          </div>
        </dl>

        <div class="flex justify-end border-t border-default pt-4">
          <UButton
            type="submit"
            label="Save changes"
            :loading="renaming"
            :disabled="!changed"
          />
        </div>
      </UForm>
    </UPageCard>
  </div>
</template>
