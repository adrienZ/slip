import MyModule from "../../../src/module";

export default defineNuxtConfig({
  modules: [
    // @ts-expect-error nuxt template
    MyModule,
  ],
});
