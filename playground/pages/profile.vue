<template>
  <UContainer
    v-if="user"
    class="mt-8 prose"
  >
    <p class="text-neutral-900 dark:text-white">
      Logged in until {{ new Date(session.expires_at).toLocaleDateString() }} - {{ new Date(session.expires_at).toLocaleTimeString() }}
    </p>

    <div class="flex flex-wrap gap-4">
      <UCard
        class="w-96"
      >
        <h3 class="mt-4 text-neutral-900 dark:text-white flex items-center">
          Verify your email
          <UIcon
            v-if="user.email_verified"
            name="i-heroicons-check-circle"
            class="w-6 h-6 text-green-400 ml-1"
          />
        </h3>

        <div v-if="!user.email_verified">
          <form
            ref="form"
            novalidate
          >
            <UFormField
              v-show="askEmailVerificationRequest.status.value === 'success'"
              label="Verification code"
              class="max-w-full mt-2"
            >
              <UInput
                v-model="formData.code"
                class="w-full"
                name="code"
                placeholder="XXXXXX"
              />
            </UFormField>
          </form>

          <UButton
            v-if="askEmailVerificationRequest.status.value !== 'success'"
            class="mt-2 w-full"
            color="primary"
            :loading="askEmailVerificationRequest.status.value === 'pending'"
            @click="askEmailVerificationRequest.refresh"
          >
            Request email verification
          </UButton>

          <UButton
            v-if="
              askEmailVerificationRequest.status.value === 'success'
            "
            class="mt-2 w-full"
            color="neutral"
            :loading="validateEmailVerificationRequest.status.value === 'pending'"
            @click="validateCode"
          >
            Validate code
          </UButton>

          <UAlert
            v-if="askEmailVerificationRequest.status.value === 'success'"
            icon="i-heroicons-command-line"
            class="not-prose mt-2"
            title="Check the terminal !"
            variant="subtle"
            color="success"
            description="As email are not implemented, the code has been sended in your terminal"
          />
        </div>
      </UCard>
    </div>
  </UContainer>
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
