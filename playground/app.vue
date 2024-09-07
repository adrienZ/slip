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

function sendForm() {
  const form = document.querySelector("form");
  const submitButton = document.querySelector("[formaction]") as HTMLElement;

  if (form && submitButton) {
    form.action = submitButton.getAttribute("formaction") ?? "";
    form.method = submitButton.getAttribute("formmethod") ?? "";
    form.submit();
  }
}
</script>

<template>
  <UContainer>
    <UHeader>
      <template #logo>
        <img
          src="~/assets/logo.webp"
          class="w-auto h-10"
        >
      </template>

      <template #right>
        <UColorModeButton />

        <UButton
          to="https://github.com/adrienZ/slip"
          target="_blank"
          icon="i-simple-icons-github"
          color="gray"
          variant="ghost"
        />
      </template>
    </UHeader>

    <div v-if="loggedIn">
      <h1>Welcome {{ user.id }}!</h1>
      <p>Logged in until {{ new Date(session.expires_at).toDateString() }}</p>
      <button @click="clear">
        Logout
      </button>
    </div>
    <div v-else>
      <UTabs :items="tabs">
        <template #item="{ item }">
          <UAuthForm
            class="mx-auto mt-12"
            :title="item.label"
            align="top"
            :fields="[{ type: 'email', name: 'email', label: 'Email', placeholder: 'Enter your email', color: 'gray' }, { type: 'password', name: 'password', label: 'Password', placeholder: 'Enter your password', color: 'gray' }]"
            :providers="[{ label: 'GitHub', icon: 'i-simple-icons-github', color: 'gray', to: '/auth/github' }]"
            :submit-button="{ label: 'Submit', type: 'submit', formmethod: 'post', formaction: item.label === 'Register' ? '/auth/register' : '/auth/login' }"
            @submit="sendForm"
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
  </UContainer>
</template>
