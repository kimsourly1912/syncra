<template>
  <main class="relative isolate min-h-dvh flex items-center justify-center">
    <UColorModeButton class="fixed top-4 right-4" />
    <slot />
    <!-- Brand wash behind the card, from semantic colors so it works in light and dark. -->
    <div
      class="fixed inset-0 -z-10 pointer-events-none bg-linear-to-b from-primary/35 via-primary/5 to-info/30"
      aria-hidden="true"
    />
  </main>
</template>
