<template>
  <header class="bg-background/75 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 -mb-px sticky top-0 z-50">
    <div class="py-4 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex items-center justify-between gap-3 h-[--header-height]">
      <div class="lg:flex-1 flex items-center gap-1.5">
        <img
          src="/logo.webp"
          class="w-auto h-10"
        >
      </div>
      <div class="flex items-center justify-end lg:flex-1 gap-1.5">
        <ClientOnly>
          <UButton
            color="neutral"
            variant="ghost"
            :icon="colorMode.value === 'dark' ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
            @click="colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'"
          />
        </ClientOnly>

        <UButton
          to="https://github.com/adrienZ/slip"
          target="_blank"
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
        />
      </div>
    </div>
    <div
      v-if="loggedIn && user"
      class="py-4 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex items-center justify-between gap-3 h-[--header-height]"
    >
      <div class="lg:flex-1 flex items-center gap-1.5">
        <h1 class="text-neutral-900 text-xl font-bold dark:text-white mb-0">
          Welcome {{ user.id }}!
        </h1>
      </div>
      <div class="flex items-center justify-end lg:flex-1 gap-1.5">
        <UButton
          color="red"
          @click="logout"
        >
          Logout
        </UButton>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession();
async function logout() {
  await clear();
  navigateTo("/");
}

const colorMode = useColorMode();
</script>
