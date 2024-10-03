<template>
  <UContainer
    v-if="user"
    class="mt-8 prose"
  >
    <p class="text-gray-900 dark:text-white">
      Logged in until {{ new Date(session.expires_at).toLocaleDateString() }} - {{ new Date(session.expires_at).toLocaleTimeString() }}
    </p>

    <div class="flex flex-wrap gap-4">
      <UCard
        class="w-96"
      >
        <h3 class="mt-4 text-gray-900 dark:text-white flex items-center">
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
            <UFormGroup
              v-show="askEmailVerificationRequest.status.value === 'success'"
              label="Verification code"
              class="max-w-full mt-2"
            >
              <UInput
                name="code"
                placeholder="XXXXXX"
              />
            </UFormGroup>
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
            v-else-if="
              validateEmailVerificationRequest.status.value !== 'success'
                || validateEmailVerificationRequest.data.value === false
            "
            class="mt-2 w-full"
            color="black"
            :loading="validateEmailVerificationRequest.status.value === 'pending'"
            @click=" validateEmailVerificationRequest.execute"
          >
            Validate code
          </UButton>

          <UAlert
            v-if="askEmailVerificationRequest.status.value === 'success'"
            icon="i-heroicons-command-line"
            class="not-prose mt-2"
            title="Check the terminal !"
            variant="subtle"
            color="green"
            description="As email are not implemented, the code has been sended in your terminal"
          />
        </div>
      </UCard>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
const { session, user, fetch } = useUserSession();
const askEmailVerificationRequest = await useLazyFetch("/api/ask-email-verification", {
  immediate: false,
  method: "POST",
});

function useFormData(form: Ref<HTMLFormElement | undefined>) {
  const data = shallowRef(new FormData());

  async function update(): Promise<void> {
    data.value = new FormData(form.value);
  }

  onMounted(() => form.value?.addEventListener("input", update));

  return {
    data,
    update,
  };
}

const form = ref<HTMLFormElement>();
const { data: formData } = useFormData(form);
const validateEmailVerificationRequest = await useLazyFetch("/api/verify-email-verification", {
  immediate: false,
  method: "POST",
  body: formData,
  watch: false,
  onResponse() {
    fetch();
  },
});
</script>
