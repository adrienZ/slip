<script setup lang="ts">
const { loggedIn, session, fetch: fetchSession } = useUserSession();

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
    router.replace({ query: { tab: tabs[value].label }, hash: "#tab" });
  },
});

function loginToGithub() {
  return navigateTo("/auth/github", {
    external: true,
  });
}

const formData = reactive({
  email: "",
  password: "",
});

const authClient = getSlipAuthClient();

const registerRequest = await useLazyAsyncData(() => authClient.register(formData), {
  immediate: false,
});

const loginRequest = await useLazyAsyncData(() => authClient.login(formData), {
  immediate: false,
});

async function handleSubmit() {
  const action = selected.value === 0 ? "register" : "login";
  const request = action === "register" ? registerRequest : loginRequest;
  await request.execute();

  const { data, error } = request;

  if (error.value) {
    return alert(error.value);
  }

  if (data.value) {
    await fetchSession();
  }
  else {
    alert(action + " failed");
  }
}
</script>

<template>
  <UContainer>
    <div
      v-if="loggedIn"
      class="mt-8 prose"
    >
      <p class="text-gray-900 dark:text-white">
        Logged in until {{ new Date(session.expires_at).toLocaleDateString() }} {{ new Date(session.expires_at).toLocaleTimeString() }}
      </p>
    </div>
    <div v-else>
      <UTabs
        v-model="selected"
        :items="tabs"
      >
        <template #item="{ item }">
          <form
            class="w-full max-w-sm space-y-6 mx-auto mt-12 register"
            @submit.prevent="handleSubmit"
          >
            <p class="text-2xl text-gray-900 dark:text-white font-bold">
              {{ item.label }}
            </p>

            <div class="space-yy-6">
              <UFormGroup
                label="Email"
              >
                <UInput
                  v-model="formData.email"
                  placeholder="Enter your email"
                  name="email"
                  type="email"
                  icon="i-heroicons-envelope"
                  color="gray"
                />
              </UFormGroup>
            </div>
            <div class="space-yy-6">
              <UFormGroup
                label="Password"
                class="space-yy-6"
              >
                <UInput
                  v-model="formData.password"

                  placeholder="Enter your password"
                  name="password"
                  type="password"
                  icon="i-heroicons-lock-closed"
                  color="gray"
                />
              </UFormGroup>
            </div>

            <UButton
              type="submit"
              block
            >
              Submit
            </UButton>

            <UDivider
              label="or"
              class="my-6"
            />

            <UButton
              icon="i-simple-icons-github"
              color="gray"
              block
              @click="loginToGithub"
            >
              Github
            </UButton>
          </form>

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
  </UContainer>
</template>
