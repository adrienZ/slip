<script setup lang="ts">
defineProps<{
  id: string
  label: string
  modelValue: string
  name?: string
  type?: string
  placeholder?: string
}>();

defineEmits<{
  "update:modelValue": [value: string]
}>();
</script>

<template>
  <div class="space-y-2">
    <label
      :for="id"
      class="block text-sm font-medium text-gray-700 dark:text-gray-200"
    >
      {{ label }}
    </label>
    <input
      :id="id"
      :value="modelValue"
      :name="name"
      :type="type"
      :placeholder="placeholder"
      class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-300 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white dark:focus:ring-gray-700"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
  </div>
</template>
