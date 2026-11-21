<script setup lang="ts">
</script>

<template>
  <div>
    <LayoutContent>
      <LayoutHeading
        title="HeroPage Management"
        description="Manage hero tagline, description, and video content"
      />

      <UCard>
        <section class="space-y-6">
          <section class="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle title="Hero Content" />
            <UButton
              label="Edit"
              size="lg"
            />
          </section>

          <ul class="space-y-4">
            <li class="flex flex-col gap-1">
              <span class="text-muted text-sm">Tagline</span>
              <p>
                Enterprise AI Solutions for Modern Supply Chains
              </p>
            </li>

            <li class="flex flex-col gap-1">
              <span class="text-muted text-sm">Description</span>
              <p>
                Syncra helps manufacturers automate complex workflows with intelligent AI modules designed for tech packs,
                quality control, and document extraction.
              </p>
            </li>

            <li class="flex flex-col gap-1">
              <span class="text-muted text-sm">Hero Video</span>
              <section class="bg-secondary-100 border-2 border-dashed border-secondary-200 rounded-lg p-10 cursor-pointer">
                <section class="flex text-center items-center justify-center flex-col gap-4">
                  <div class="size-20 rounded-full bg-white flex items-center justify-center">
                    <UIcon
                      name="lucide:video"
                      class="text-3xl text-muted"
                    />
                  </div>
                  <section>
                    <h1 class="text-lg">
                      No Video Uploaded
                    </h1>
                    <p class="text-muted text-sm">
                      Click Edit to upload a hero video
                    </p>
                  </section>
                </section>
              </section>
            </li>
          </ul>
        </section>
      </UCard>
    </LayoutContent>
  </div>
</template>
