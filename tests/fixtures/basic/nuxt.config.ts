import MyModule from "../../../src/module";

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  nitro: {
    database: {
      default: {
        connector: "better-sqlite3",
        options: {
          name: "basic.test",
        },
      },
    },
  },
});
