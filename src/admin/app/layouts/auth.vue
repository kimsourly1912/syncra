<script setup lang="ts">

</script>

<template>
  <main>
    <section class="min-h-screen flex items-center justify-center">
      <slot />
    </section>
    <section class="fixed inset-0 -z-10 flex flex-col pointer-events-none select-none">
      <div class="bg-gradient-top flex-1" />
      <div class="bg-gradient-bottom flex-1" />
    </section>
  </main>
</template>

<style scoped>
.bg-gradient-top {
  background: linear-gradient(
    180deg,
    rgba(75, 184, 171, 0.6) 0%,
    rgba(75, 184, 171, 0.3) 48.4%,
    rgba(97, 189, 221, 0.2) 100%
  );
}

.bg-gradient-bottom {
  background: linear-gradient(
    180deg,
    rgba(97, 189, 221, 0.2) 0%,
    rgba(97, 189, 221, 0.5) 51.6%,
    rgba(97, 189, 221, 0.73) 100%
  );
}
</style>
