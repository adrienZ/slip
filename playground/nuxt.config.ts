export default defineNuxtConfig({
  modules: ["@nuxt/devtools", "../src/module", "@nuxt/ui"],
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
    // added for codesandbox
    session: {
      cookie: {
        // Required when SameSite=None is set
        secure: true,
        // This allows the cookie to be used in iframes
        sameSite: "None",
        // Ensures cookie is accessible across the whole domain
        path: "/",
      },
    },
  },
});
