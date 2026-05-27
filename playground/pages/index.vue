<script setup lang="ts">
const { loggedIn, session, fetch: fetchSession } = useUserSession();

const tabs = [{
  label: "Register",
  icon: "heroicons:user-plus-20-solid",
}, {
  label: "Login",
  icon: "heroicons:lock-open-20-solid",
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

const authClient = getSlipAuthClient({
  baseURL: useRequestURL().origin,
});

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
    // triggernavifation
    await navigateTo("/profile?auth=success");
  }
  else {
    alert(action + " failed");
  }
}
</script>

<template>
  <PlaygroundContainer>
    <div
      v-if="loggedIn && session"
      class="mt-8"
    >
      <p class="text-gray-900 dark:text-white">
        Logged in until {{ new Date(session.expires_at).toLocaleDateString() }} {{ new Date(session.expires_at).toLocaleTimeString() }}
      </p>
    </div>
    <div v-else>
      <div
        id="tab"
        class="mx-auto mt-12 w-full max-w-sm"
      >
        <PlaygroundTabs
          v-model="selected"
          :items="tabs"
        />

        <form
          class="w-full space-y-6 pt-8 register"
          @submit.prevent="handleSubmit"
        >
          <p class="text-2xl text-gray-900 dark:text-white font-bold">
            {{ tabs[selected].label }}
          </p>

          <PlaygroundTextInput
            id="email"
            v-model="formData.email"
            label="Email"
            placeholder="Enter your email"
            name="email"
            type="email"
          />

          <PlaygroundTextInput
            id="password"
            v-model="formData.password"
            label="Password"
            placeholder="Enter your password"
            name="password"
            type="password"
          />

          <PlaygroundButton
            type="submit"
            block
          >
            Submit
          </PlaygroundButton>

          <PlaygroundDivider>or</PlaygroundDivider>

          <PlaygroundButton
            type="button"
            variant="outline"
            block
            @click="loginToGithub"
          >
            <Icon
              name="simple-icons:github"
              class="h-4 w-4"
            />
            Github
          </PlaygroundButton>
        </form>

        <PlaygroundAlert
          title="Warning !"
          class="mt-2"
        >
          Github or any OAuth provider will not work inside an iframe, Stackblitz or Codesandbox
        </PlaygroundAlert>
      </div>
    </div>
  </PlaygroundContainer>
</template>
