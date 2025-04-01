<script setup lang="ts">
</script>

<template>
  <UContainer class="main-container min-h-screen flex flex-col">
    <TheHeader />

    <NuxtLayout>
      <NuxtPage class="flex-grow w-full" />
    </NuxtLayout>

    <TheFooter />
  </UContainer>
</template>
