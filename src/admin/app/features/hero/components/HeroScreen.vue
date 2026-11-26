<script setup lang="ts">
import { createReusableTemplate, useObjectUrl } from '@vueuse/core'

// The preview is drawn in two places, as on the create pages: beside the content from `lg`, and
// in a modal below it.
const [DefinePreview, ReusePreview] = createReusableTemplate<{ bare?: boolean }>()
const previewOpen = ref(false)

// Static page: there's no hero content API yet (open question). The content below is sample
// text; editing changes the preview only, and Save stays disabled and says why.
const SAVE_HINT = 'Saving hero content isn\'t available yet.'

interface HeroContent {
  tagline: string
  description: string
  video: File | null
}

const saved = reactive<HeroContent>({
  tagline: 'Enterprise AI Solutions for Modern Supply Chains',
  description: 'Syncra helps manufacturers automate complex workflows with intelligent AI modules designed for tech packs, quality control, and document extraction.',
  video: null,
})

const editing = ref(false)
const draft = reactive<HeroContent>({ ...saved })

// What the preview shows: the draft while editing, the saved content otherwise.
const shown = computed(() => (editing.value ? draft : saved))
const videoUrl = useObjectUrl(() => shown.value.video)

const VIDEO_TYPES = ['video/mp4', 'video/webm']
const videoError = ref('')
watch(() => draft.video, (file) => {
  videoError.value = ''
  if (file && !VIDEO_TYPES.includes(file.type)) {
    videoError.value = 'Choose an MP4 or WebM video.'
    draft.video = null
  }
})

function startEditing() {
  Object.assign(draft, saved)
  videoError.value = ''
  editing.value = true
}
function cancelEditing() {
  editing.value = false
}

const fileSize = (file: File) => `${(file.size / 1024 / 1024).toFixed(1)} MB`
</script>

<template>
  <UDashboardPanel class="page-narrow">
    <template #header>
      <UDashboardNavbar
        icon="lucide:panels-top-left"
        title="Hero page management"
      >
        <template #right>
          <!-- From `sm` to `lg` the preview isn't beside the content; this opens it. On a phone the
               navbar keeps two actions (Cancel, Save), so the button sits in the body instead. -->
          <UButton
            label="Preview"
            icon="lucide:eye"
            color="neutral"
            variant="outline"
            class="hidden sm:inline-flex lg:hidden"
            @click="previewOpen = true"
          />
          <UBadge
            label="Sample data"
            color="neutral"
            variant="subtle"
            class="hidden sm:inline-flex"
          />
          <!-- Icon only on a phone, so the title keeps its room. -->
          <UButton
            v-if="!editing"
            icon="lucide:pencil"
            aria-label="Edit"
            @click="startEditing"
          >
            <span class="hidden sm:inline">Edit</span>
          </UButton>
          <template v-else>
            <UButton
              icon="lucide:x"
              color="neutral"
              variant="ghost"
              aria-label="Cancel"
              @click="cancelEditing"
            >
              <span class="hidden sm:inline">Cancel</span>
            </UButton>
            <!-- A disabled button gets no pointer events, so the hint sits on this wrapper. -->
            <span :title="SAVE_HINT">
              <UButton
                icon="lucide:check"
                disabled
                aria-label="Save"
                aria-describedby="hero-save-hint"
              >
                <span class="hidden sm:inline">Save</span>
              </UButton>
            </span>
            <span
              id="hero-save-hint"
              class="sr-only"
            >{{ SAVE_HINT }}</span>
          </template>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- How the hero reads at the top of the website; it follows the fields while editing. -->
      <DefinePreview v-slot="{ bare }">
        <!-- Framed beside the form; bare in the modal, which has its own frame and padding. -->
        <div
          class="space-y-4"
          :class="bare ? '' : 'rounded-xl border border-default bg-elevated/40 p-5'"
        >
          <div class="aspect-video overflow-hidden rounded-lg border border-default bg-muted">
            <video
              v-if="videoUrl"
              :src="videoUrl"
              class="size-full object-cover"
              controls
              muted
              playsinline
            />
            <div
              v-else
              class="flex size-full flex-col items-center justify-center gap-2 text-muted"
            >
              <UIcon
                name="lucide:circle-play"
                class="size-8"
              />
              <span class="text-sm">No video yet</span>
            </div>
          </div>
          <h2
            class="text-xl font-semibold text-balance wrap-anywhere"
            :class="shown.tagline.trim() ? 'text-highlighted' : 'text-muted'"
          >
            {{ shown.tagline.trim() || 'Your tagline' }}
          </h2>
          <p
            class="text-sm text-pretty wrap-anywhere"
            :class="shown.description.trim() ? 'text-muted' : 'text-muted italic'"
          >
            {{ shown.description.trim() || 'A sentence or two under the tagline.' }}
          </p>
        </div>
      </DefinePreview>

      <!-- Phone: the navbar's Preview, here so the navbar keeps two actions. -->
      <UButton
        label="Preview on the website"
        icon="lucide:eye"
        color="neutral"
        variant="outline"
        block
        class="sm:hidden"
        @click="previewOpen = true"
      />

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <UPageCard
          title="Hero content"
          :description="editing ? 'Changes show in the preview above. Saving isn\'t connected yet.' : 'The headline section at the top of the website.'"
          variant="outline"
        >
          <!-- Reading -->
          <dl
            v-if="!editing"
            class="space-y-4"
          >
            <div>
              <dt class="text-sm text-muted">
                Tagline
              </dt>
              <dd class="mt-1 text-highlighted">
                {{ saved.tagline || NO_VALUE }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-muted">
                Description
              </dt>
              <dd class="mt-1 text-highlighted">
                {{ saved.description || NO_VALUE }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-muted">
                Video
              </dt>
              <dd class="mt-1 text-highlighted">
                <template v-if="saved.video">
                  {{ saved.video.name }}
                </template>
                <span
                  v-else
                  class="text-muted"
                >None. Choose Edit to add one.</span>
              </dd>
            </div>
          </dl>

          <!-- Editing -->
          <div
            v-else
            class="space-y-5"
          >
            <UFormField
              label="Tagline"
              name="tagline"
              :hint="`${draft.tagline.length} characters`"
            >
              <UInput
                v-model="draft.tagline"
                placeholder="e.g. Enterprise AI for modern supply chains"
                class="w-full"
                autofocus
              />
            </UFormField>

            <UFormField
              label="Description"
              name="description"
              :hint="`${draft.description.length} characters`"
            >
              <UTextarea
                v-model="draft.description"
                placeholder="What Syncra does, in a sentence or two."
                :rows="3"
                autoresize
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Video"
              name="video"
              description="MP4 or WebM. It plays in the preview above."
              :error="videoError || undefined"
            >
              <UFileUpload
                v-slot="{ open, removeFile }"
                v-model="draft.video"
                accept="video/mp4,video/webm"
                class="mt-1"
              >
                <div
                  v-if="draft.video"
                  class="flex items-center gap-3 rounded-lg border border-default p-3"
                >
                  <UIcon
                    name="lucide:file-video"
                    class="size-6 shrink-0 text-muted"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-highlighted">
                      {{ draft.video.name }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ fileSize(draft.video) }}
                    </p>
                  </div>
                  <UButton
                    label="Replace"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    @click="open()"
                  />
                  <UButton
                    icon="lucide:trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    aria-label="Remove video"
                    @click="removeFile()"
                  />
                </div>
                <button
                  v-else
                  type="button"
                  class="flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-accented bg-elevated/50 px-4 py-6 text-center transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary"
                  @click="open()"
                >
                  <UIcon
                    name="lucide:upload"
                    class="size-5 text-muted"
                  />
                  <span class="text-sm font-medium text-highlighted">Upload a video</span>
                  <span class="text-xs text-muted">or drop it here</span>
                </button>
              </UFileUpload>
            </UFormField>
          </div>
        </UPageCard>

        <!-- Beside the content from lg, following the page; below lg the navbar's Preview opens it. -->
        <aside
          class="hidden space-y-2 lg:sticky lg:top-0 lg:block"
          aria-label="Website preview"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-medium text-highlighted">
              Website preview
            </p>
            <UBadge
              v-if="editing"
              label="Your edits"
              icon="lucide:pencil"
              color="primary"
              variant="subtle"
              size="sm"
            />
          </div>
          <ReusePreview />
        </aside>
      </div>

      <UModal
        v-model:open="previewOpen"
        title="Website preview"
        :description="editing ? 'Showing your edits. Saving isn\'t connected yet.' : 'The headline section at the top of the website.'"
      >
        <template #body>
          <ReusePreview bare />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
