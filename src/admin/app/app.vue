<script setup lang="ts">

</script>

<template>
  <UApp :toaster="{ position: 'top-right', max: 3 }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <NuxtLoadingIndicator />
  </UApp>
</template>
