<script setup lang="ts">
type TableRow = Record<string, string | number | boolean | null>;

const props = defineProps<{
  rows: TableRow[]
  columns?: string[]
}>();

const resolvedColumns = computed(() => props.columns ?? (props.rows[0] ? Object.keys(props.rows[0]) : []));
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
    <table class="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
      <thead class="bg-gray-50 dark:bg-gray-900">
        <tr>
          <th
            v-for="column in resolvedColumns"
            :key="column"
            scope="col"
            class="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100"
          >
            {{ column }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-950">
        <tr
          v-for="(row, index) in rows"
          :key="String(row.id ?? index)"
        >
          <td
            v-for="column in resolvedColumns"
            :key="column"
            class="px-4 py-3 text-gray-700 dark:text-gray-300"
          >
            {{ row[column] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
