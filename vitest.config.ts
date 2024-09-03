import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    outputFile: {
      junit: "./junit.xml",
    },
  },
});
