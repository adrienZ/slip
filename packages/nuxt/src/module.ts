import { defineNuxtModule, createResolver, installModule, addServerScanDir } from "@nuxt/kit";
import type { SlipModuleOptions } from "./runtime/types";

// Module options TypeScript interface definition
export interface ModuleOptions extends SlipModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "slip",
    configKey: "slip",
  },
  // Default configuration options of the Nuxt module
  defaults: {
    dialect: "sqlite",
    tableNames: {
      sessions: "slip_auth_sessions",
      users: "slip_auth_users",
      oauthAccounts: "slip_auth_oauth_accounts",
    },
  },
  async setup(options, nuxt) {
    // setup
    const resolver = createResolver(import.meta.url);

    await installModule("nuxt-auth-utils");

    // use private runtime config to expost options in nitro
    const runtimeConfig = nuxt.options.runtimeConfig;
    runtimeConfig.slipAuth = options;

    nuxt.hook("nitro:config", (nitroConfig) => {
      nitroConfig.experimental.database = true;
    });
    addServerScanDir(resolver.resolve("./runtime/server/"));
  },
});
