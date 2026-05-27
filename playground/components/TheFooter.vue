<template>
  <PlaygroundContainer class="pb-4">
    <PlaygroundTable
      v-if="usersInDb?.length"
      class="mt-12"
      :rows="usersInDb"
      :columns="columns"
    />
  </PlaygroundContainer>
</template>

<script setup lang="ts">
type UserRow = Record<string, string | number | boolean | null>;

const { data: usersInDb, refresh } = await useAsyncData<UserRow[]>("usersInDb", () => $fetch("/api/users"));
const route = useRoute();

const columns = computed(() => usersInDb.value?.[0] ? Object.keys(usersInDb.value[0]) : []);

watch(() => route.fullPath, () => {
  refresh();
});
</script>
