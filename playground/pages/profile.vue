<template>
  <PlaygroundContainer
    v-if="user && session"
    class="mt-8"
  >
    <p class="text-gray-900 dark:text-white">
      Logged in until {{ new Date(session.expires_at).toLocaleDateString() }} - {{ new Date(session.expires_at).toLocaleTimeString() }}
    </p>

    <div class="flex flex-wrap gap-4">
      <PlaygroundCard class="w-full max-w-sm">
        <h3 class="mt-4 text-gray-900 dark:text-white flex items-center">
          Verify your email
          <Icon
            v-if="user.email_verified"
            name="heroicons:check-circle-20-solid"
            class="w-6 h-6 text-green-400 ml-1"
          />
        </h3>

        <div v-if="!user.email_verified">
          <form
            ref="form"
            novalidate
          >
            <div
              v-show="askEmailVerificationRequest.status.value === 'success'"
              class="max-w-full mt-2"
            >
              <PlaygroundTextInput
                id="verification-code"
                v-model="formData.code"
                label="Verification code"
                name="code"
                placeholder="XXXXXX"
              />
            </div>
          </form>

          <PlaygroundButton
            v-if="askEmailVerificationRequest.status.value !== 'success'"
            type="button"
            class="mt-2"
            block
            :disabled="askEmailVerificationRequest.status.value === 'pending'"
            @click="requestEmailVerification"
          >
            {{ askEmailVerificationRequest.status.value === 'pending' ? "Requesting..." : "Request email verification" }}
          </PlaygroundButton>

          <PlaygroundButton
            v-if="
              askEmailVerificationRequest.status.value === 'success'
            "
            type="button"
            class="mt-2"
            block
            :disabled="validateEmailVerificationRequest.status.value === 'pending'"
            @click="validateCode"
          >
            {{ validateEmailVerificationRequest.status.value === 'pending' ? "Validating..." : "Validate code" }}
          </PlaygroundButton>

          <PlaygroundAlert
            v-if="askEmailVerificationRequest.status.value === 'success'"
            title="Check the terminal !"
            color="green"
            class="mt-2"
          >
            As email are not implemented, the code has been sended in your terminal
          </PlaygroundAlert>
        </div>
      </PlaygroundCard>
    </div>
  </PlaygroundContainer>
</template>

<script setup lang="ts">
const { session, user, fetch: fetchSession } = useUserSession();
const authClient = getSlipAuthClient({
  baseURL: useRequestURL().origin,
});

const askEmailVerificationRequest = await useLazyAsyncData(() => authClient.askEmailVerificationCode(), {
  immediate: false,
});

const formData = reactive({
  code: "",
});

const form = ref<HTMLFormElement>();
const validateEmailVerificationRequest = await useLazyAsyncData(() => authClient.verifyEmailVerificationCode(formData), {
  immediate: false,
});

function requestEmailVerification() {
  return askEmailVerificationRequest.refresh();
}

async function validateCode() {
  await validateEmailVerificationRequest.execute();
  const { error, data } = validateEmailVerificationRequest;
  if (error.value) {
    return alert(error.value);
  }

  if (data.value) {
    await fetchSession();
  }
  else {
    alert("validation failed");
  }
}
</script>
