<template>
  <div class="min-h-screen flex flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <TheHeader />

    <main class="flex-1 w-full">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </main>

    <TheFooter />
  </div>
</template>
