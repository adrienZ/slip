<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: "button" | "submit" | "reset"
  variant?: "solid" | "outline" | "ghost" | "danger"
  block?: boolean
  square?: boolean
  disabled?: boolean
  to?: string
  target?: string
  rel?: string
  ariaLabel?: string
}>(), {
  type: "button",
  variant: "solid",
  rel: undefined,
});

const baseClass = "inline-flex items-center justify-center font-medium transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

const sizeClass = computed(() => props.square ? "h-9 w-9 rounded-md text-sm" : "rounded-md px-4 py-2 text-sm");
const widthClass = computed(() => props.block ? "w-full" : "");
const variantClass = computed(() => {
  switch (props.variant) {
    case "danger":
      return "bg-red-600 text-white hover:bg-red-500 focus:ring-red-400";
    case "ghost":
      return "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white";
    case "outline":
      return "gap-2 border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900";
    default:
      return "bg-gray-900 text-white hover:bg-gray-700 focus:ring-gray-400 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200";
  }
});

const classes = computed(() => [
  baseClass,
  sizeClass.value,
  widthClass.value,
  variantClass.value,
]);
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :target="target"
    :rel="rel"
    :class="classes"
    :aria-label="ariaLabel"
  >
    <slot />
  </NuxtLink>
  <button
    v-else
    :type="type"
    :disabled="disabled"
    :class="classes"
    :aria-label="ariaLabel"
  >
    <slot />
  </button>
</template>
