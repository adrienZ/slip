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
          <UFormGroup

            label="Verification code"
            class="max-w-full mt-2"
          >
            <UInput
              placeholder="XXXXXX"
            />
          </UFormGroup>

          <UButton
            class="mt-2 w-full"
            color="amber"
            :loading="true"
          >
            Request email verification
          </UButton>

          <UAlert
            icon="i-heroicons-command-line"
            class="not-prose mt-2"
            title="(check the terminal)"
            variant="subtle"
            color="green"
            description="You can add components to your app using the cli."
          />
        </div>
      </UCard>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
const { session, user } = useUserSession();
</script>
