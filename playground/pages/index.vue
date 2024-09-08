<script setup lang="ts">
const { loggedIn, user, session, clear } = useUserSession();

const { data: usersInDb } = await useAsyncData("usersInDb", () => $fetch("/api/users"));

const tabs = [{
  label: "Register",
  icon: "i-heroicons-solid-user-plus",
}, {
  label: "Login",
  icon: "i-heroicons-solid-lock-open",
}];

const route = useRoute();
const router = useRouter();

const selected = computed({
  get() {
    const index = tabs.findIndex(item => item.label === route.query.tab);
    if (index === -1) {
      return 0;
    }

    return index;
  },
  set(value) {
    // Hash is specified here to prevent the page from scrolling to the top
    router.replace({ query: { tab: tabs[value].label }, hash: "#control-the-selected-index" });
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sendForm(item: any) {
  const form = document.querySelector(`.${item.label.toLowerCase()} form`) as HTMLFormElement;
  const submitButton = document.querySelector(`.${item.label.toLowerCase()} [formaction]`) as HTMLElement;

  if (form && submitButton) {
    form.action = submitButton.getAttribute("formaction") ?? "";
    form.method = submitButton.getAttribute("formmethod") ?? "";
    form.submit();
  }
}

function loginToGithub() {
  return navigateTo("/auth/github", {
    external: true,
  });
}
</script>

<template>
  <div
    v-if="loggedIn"
    class="mt-12 prose"
  >
    <h1 class="text-gray-900 dark:text-white mb-0">
      Welcome {{ user.id }}!
    </h1>
    <p class="text-gray-900 dark:text-white">
      Logged in until {{ new Date(session.expires_at).toDateString() }}
    </p>

    <UDivider class="my-4" />

    <UButton
      color="red"
      @click="clear"
    >
      Logout
    </UButton>
  </div>
  <div v-else>
    <UTabs
      v-model="selected"
      :items="tabs"
    >
      <template #item="{ item }">
        <UAuthForm
          class="mx-auto mt-12"
          :title="item.label"
          :class="`${item.label.toLowerCase()}`"
          align="top"
          :fields="[{ type: 'email', name: 'email', label: 'Email', placeholder: 'Enter your email', color: 'gray' }, { type: 'password', name: 'password', label: 'Password', placeholder: 'Enter your password', color: 'gray' }]"
          :providers="[{ label: 'GitHub', icon: 'i-simple-icons-github', color: 'gray', click: loginToGithub }]"
          :submit-button="{ label: 'Submit', type: 'submit', formmethod: 'post', formaction: item.label === 'Register' ? '/auth/register' : '/auth/login' }"
          @submit="sendForm(item)"
        />
        <UAlert
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link', padded: false }"
          color="orange"
          class="max-w-sm mt-2 mx-auto"
          variant="subtle"
          title="Warning !"
          description="Github or any OAuth provider will not work inside an iframe, Stackblitz or Codesandbox"
        />
      </template>
    </UTabs>
  </div>

  <UTable
    v-if="usersInDb"
    class="mt-12"
    :rows="usersInDb.rows"
  />
</template>
