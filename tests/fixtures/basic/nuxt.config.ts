import MyModule from "../../../src/module";

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  nitro: {
    database: {
      default: {
        connector: "sqlite",
        options: {
          name: "basic.test",
        },
      },
    },
  },
});
