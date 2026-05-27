<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  color?: "orange" | "green"
}>(), {
  color: "orange",
});

const colorClass = computed(() => {
  if (props.color === "green") {
    return "border-green-200 bg-green-50 text-green-900 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-100";
  }

  return "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-100";
});
</script>

<template>
  <div
    class="rounded-md border p-4 text-sm"
    :class="colorClass"
    role="alert"
  >
    <p
      v-if="title"
      class="font-semibold"
    >
      {{ title }}
    </p>
    <p :class="{ 'mt-1': title }">
      <slot />
    </p>
  </div>
</template>
