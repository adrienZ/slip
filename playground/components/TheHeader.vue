<template>
  <header class="bg-background/75 backdrop-blur border-b border-gray-200 dark:border-gray-800 -mb-px sticky top-0 z-50">
    <div class="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex items-center justify-between gap-3 h-[--header-height]">
      <div class="lg:flex-1 flex items-center gap-1.5">
        <img
          src="/logo.webp"
          class="w-auto h-10"
        >
      </div>
      <div class="flex items-center justify-end lg:flex-1 gap-1.5">
        <ClientOnly>
          <UButton
            color="gray"
            variant="ghost"
            :icon="colorMode.value === 'dark' ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
            @click="colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'"
          />
        </ClientOnly>

        <UButton
          to="https://github.com/adrienZ/slip"
          target="_blank"
          icon="i-simple-icons-github"
          color="gray"
          variant="ghost"
        />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const colorMode = useColorMode();
</script>
