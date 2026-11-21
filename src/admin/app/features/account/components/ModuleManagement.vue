<script setup lang="ts">

</script>

<template>
  <CardTitle title="Module Management" />

  <section class="bg-elevated space-y-5 rounded-lg ring ring-default p-4">
    <section class="flex items-start justify-between gap-4">
      <section class="flex gap-4 sm:flex-row flex-col">
        <section class="flex items-start justify-between gap-4">
          <div class="size-16 min-w-16 rounded-lg flex items-center justify-center bg-default">
            <NuxtImg
              src="/img/doc-ai.png"
              class="w-full"
            />
          </div>
          <UBadge
            variant="subtle"
            label="Active"
            size="lg"
            class="sm:hidden"
          />
        </section>

        <div>
          <h1 class="text-lg font-medium text-highlighted">
            Doc AI
          </h1>
          <p class="text-muted">
            AI-powered document processing and extraction for tech packs, invoices, and compliance documents
          </p>
        </div>
      </section>

      <UBadge
        class="max-sm:hidden"
        variant="subtle"
        label="Active"
        size="lg"
      />
    </section>

    <section class="space-y-6 border-t border-default pt-4">
      <section class="space-y-2">
        <CardTitle title="Activation Period" />

        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-4 ring ring-default rounded-lg py-4 px-6 bg-default">
          <li>
            <span class="text-muted text-sm">Start Date</span> <br>
            <span class="text-highlighted">2026-01-01</span>
          </li>
          <li>
            <span class="text-muted text-sm">End Date</span> <br>
            <span class="text-highlighted">No Expiry</span>
          </li>
        </ul>
      </section>

      <section class="space-y-2">
        <CardTitle title="Activated Feature" />
        <UButton
          label="TechPack"
          variant="outline"
        />
      </section>
    </section>

    <footer class="border-t border-default pt-4">
      <section class="flex gap-4 justify-end flex-wrap">
        <UButton
          label="Deactivate"
          color="error"
          variant="outline"
        />
        <UButton
          label="Edit Activation"
          color="neutral"
          variant="outline"
        />
      </section>
    </footer>
  </section>
</template>
