// @ts-check
import { createConfigForNuxt } from "@nuxt/eslint-config/flat";

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    // Rules for module authors
    tooling: true,
    // Rules for formatting
    stylistic: true,
  },
  dirs: {
    src: [
      "./playground",
    ],
  },
})
  .overrideRules({
    "@stylistic/quotes": ["error", "double"],
    "@stylistic/semi": ["error", "always"],
    "import/order": "off",
  })
  .append(
    // your custom flat config here...
  );
