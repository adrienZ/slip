<script setup lang="ts">
defineProps<{
  items: Array<{ label: string, icon?: string }>
  modelValue: number
}>();

defineEmits<{
  "update:modelValue": [value: number]
}>();
</script>

<template>
  <div
    class="grid grid-cols-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-900"
    role="tablist"
    aria-label="Authentication mode"
  >
    <button
      v-for="(item, index) in items"
      :key="item.label"
      type="button"
      role="tab"
      :aria-selected="modelValue === index"
      class="rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-gray-400"
      :class="modelValue === index ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'"
      @click="$emit('update:modelValue', index)"
    >
      <Icon
        v-if="item.icon"
        :name="item.icon"
        class="h-4 w-4"
      />
      {{ item.label }}
    </button>
  </div>
</template>
