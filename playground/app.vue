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

    <NuxtLayout>
      <NuxtPage/>
    </NuxtLayout>
  </UContainer>
</template>
