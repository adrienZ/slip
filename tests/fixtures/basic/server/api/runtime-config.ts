import { useRuntimeConfig } from "#imports";

export default defineEventHandler(async () => {
  return useRuntimeConfig();
});
