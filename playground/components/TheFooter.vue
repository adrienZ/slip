<template>
  <div class="pb-4">
    <UTable
      v-if="usersInDb"
      class="mt-12"
      :rows="usersInDb"
    />
  </div>
</template>

<script setup lang="ts">
const { data: usersInDb } = await useAsyncData("usersInDb", () => $fetch("/api/users"));
</script>
