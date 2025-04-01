import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({

  modules: [
    "../src/module",
    "@nuxt/ui",
    // optional
    "@nuxthub/core",
  ],

  css: ["~/assets/css/main.css"],

  // #region - codesandbox config
  runtimeConfig: {
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
  compatibilityDate: "2024-07-27",
  nitro: {
    database: {
      default: {
        connector: "better-sqlite3",
      },
      libsql: {
        connector: "libsql",
        options: {
          url: "file:./.data/libsql.playground.db",
        },
      },
      d1: {
        connector: "cloudflare-d1",
        options: {
          bindingName: "DB",
        },
      },
    },
  },
  // #endregion

  // #region nuxthub enable database
  hub: {
    database: true,
  },
  // #endregion

  slipAuth: {
    database: {
      nitroDatabaseName: "default",
      dialect: "better-sqlite3",
    },
  },

  // #region faster demo startup
  tailwindcss: {
    viewer: false,
  },
  // #endregion
});
