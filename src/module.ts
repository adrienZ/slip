import { defineNuxtModule, createResolver, installModule, addServerScanDir, updateRuntimeConfig } from "@nuxt/kit";
import type { SessionConfig, SlipModuleOptions } from "./runtime/types";

// Module options TypeScript interface definition
export interface ModuleOptions extends SlipModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-slip-auth",
    configKey: "slipAuth",
  },
  // Default configuration options of the Nuxt module
  defaults: {
    database: {
      dialect: "libsql",
      nitroDatabaseName: "default",
    },
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
    // update session maxAge runtime config from nuxt-auth-utils
    const overridenSessionConfig: Partial<SessionConfig> = {
      maxAge: options.sessionMaxAge,
    };
    updateRuntimeConfig({
      session: overridenSessionConfig,
    });
    // #endregion

    nuxt.hook("nitro:config", (nitroConfig) => {
      nitroConfig.experimental = {
        ...nitroConfig.experimental,
        database: true,
        // needed for purging expired sessions
        tasks: true,
      };

      nitroConfig.scheduledTasks = {
        ...nitroConfig.scheduledTasks,
        // @daily https://crontab.guru/#00_00_*_*_*
        "00 00 * * *": ["slip:db:expired-sessions"],
      };
    });

    // module logic
    addServerScanDir(resolver.resolve("./runtime/server"));

    // https://github.com/nuxt/nuxt/discussions/16780#discussioncomment-3723152
    nuxt.hook("nitro:config", (nitro) => {
      // ensure `nitro.plugins` is initialized
      nitro.plugins = nitro.plugins || [];

      // add your custom plugin
      // nitro.plugins.push(resolver.resolve("runtime/server/plugins/sessions.plugin"));
      // nitro.plugins.push(resolver.resolve("runtime/server/plugins/auto-setup.plugin"));
    });
  },
});
