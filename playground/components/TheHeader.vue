<template>
  <header class="sticky top-0 z-50 -mb-px border-b border-gray-200 bg-white/75 backdrop-blur dark:border-gray-800 dark:bg-gray-950/75">
    <PlaygroundContainer class="py-4 flex items-center justify-between gap-3 h-[--header-height]">
      <div class="lg:flex-1 flex items-center gap-1.5">
        <img
          src="/logo.webp"
          class="w-auto h-10"
        >
      </div>
      <div class="flex items-center justify-end lg:flex-1 gap-1.5">
        <ClientOnly>
          <PlaygroundButton
            type="button"
            variant="ghost"
            square
            :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleTheme"
          >
            <Icon
              :name="theme === 'dark' ? 'heroicons:moon-20-solid' : 'heroicons:sun-20-solid'"
              class="h-5 w-5"
            />
          </PlaygroundButton>
        </ClientOnly>

        <PlaygroundButton
          to="https://github.com/adrienZ/slip"
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          square
          aria-label="Open GitHub repository"
        >
          <Icon
            name="simple-icons:github"
            class="h-5 w-5"
          />
        </PlaygroundButton>
      </div>
    </PlaygroundContainer>
    <PlaygroundContainer
      v-if="loggedIn && user"
      class="py-4 flex items-center justify-between gap-3 h-[--header-height]"
    >
      <div class="lg:flex-1 flex items-center gap-1.5">
        <h1 class="text-gray-900 text-xl font-bold dark:text-white mb-0">
          Welcome {{ user.id }}!
        </h1>
      </div>
      <div class="flex items-center justify-end lg:flex-1 gap-1.5">
        <PlaygroundButton
          type="button"
          variant="danger"
          @click="logout"
        >
          Logout
        </PlaygroundButton>
      </div>
    </PlaygroundContainer>
  </header>
</template>

<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession();
const theme = ref<"light" | "dark">("light");

function applyTheme(value: "light" | "dark") {
  theme.value = value;
  document.documentElement.classList.toggle("dark", value === "dark");
  localStorage.setItem("playground-theme", value);
}

function toggleTheme() {
  applyTheme(theme.value === "dark" ? "light" : "dark");
}

async function logout() {
  await clear();
  navigateTo("/");
}

onMounted(() => {
  const savedTheme = localStorage.getItem("playground-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light");
});
</script>
