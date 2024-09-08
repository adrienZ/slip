export default defineNuxtConfig({
  modules: ["../src/module", "@nuxt/ui"],
  extends: ["@nuxt/ui-pro"],
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
  runtimeConfig: {
    // added to be overriden in .env files for codesandbox
    session: {
      cookie: {
        sameSite: "",
        secure: true,
        path: "",
      },
    },
  },
});
