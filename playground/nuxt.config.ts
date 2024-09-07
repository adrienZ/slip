export default defineNuxtConfig({
  modules: ["../src/module", "@nuxt/ui"],
  devtools: { enabled: true },
  compatibilityDate: "2024-07-27",
  slipAuth: {
    database: {
      nitroDatabaseName: "default",
      dialect: "sqlite",
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
  tailwindcss: {
    viewer: false,
    // cssPath: false,
    // and more...
  },
});
