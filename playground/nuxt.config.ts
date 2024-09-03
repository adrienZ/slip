export default defineNuxtConfig({
  modules: ["../src/module"],
  devtools: { enabled: true },
  compatibilityDate: "2024-07-27",
  slipAuth: {
    database: {
      nitroDatabaseName: "libsql",
      dialect: "libsql",
    },
  },
  nitro: {
    database: {
      default: {
        connector: "sqlite",
      },
      libsql: {
        connector: "libsql",
        options: {
          url: "file:./.data/libsql.playground.db",
        },
      },
    },
  },
});
