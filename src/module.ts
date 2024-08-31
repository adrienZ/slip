import { defineNuxtModule, createResolver, installModule, addServerScanDir, addServerPlugin } from "@nuxt/kit";
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
    sessionMaxAge: 60 * 60 * 24 * 7, // 7 days
    tableNames: {
      sessions: "slip_auth_sessions",
      users: "slip_auth_users",
      oauthAccounts: "slip_auth_oauth_accounts",
    },
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    await installModule("nuxt-auth-utils");

    // #region use private runtime config to expose options in nitro
    const runtimeConfig = nuxt.options.runtimeConfig;
    runtimeConfig.slipAuth = options;
    // nuxt-auth-utils compat
    // @ts-expect-error TODO: nuxt-auth-utils typing is mising
    runtimeConfig.slipAuth.sessionMaxAge = runtimeConfig.session?.maxAge ?? options.sessionMaxAge;
    // #endregion

    // #region make sure nitro database feature flag is turned on
    nuxt.hook("nitro:config", (nitroConfig) => {
      nitroConfig.experimental = {
        ...nitroConfig.experimental,
        database: true,
      };
    });
    // #endregion

    // module logic
    addServerScanDir(resolver.resolve("./runtime/server"));
    addServerPlugin(resolver.resolve("./runtime/server/plugins/sessions.plugin"));
  },
});
