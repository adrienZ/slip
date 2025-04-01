import { defineNuxtModule, createResolver, installModule, addServerScanDir, updateRuntimeConfig, addServerHandler, addImportsDir } from "@nuxt/kit";
import type { SessionConfig, SlipModuleOptions } from "./runtime/types";
import { defaultTableNames } from "./runtime/nuxt/defaults";
import { routerRecord } from "./runtime/h3/routerRecord";
// Module options TypeScript interface definition
export type ModuleOptions = SlipModuleOptions;

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-slip-auth",
    configKey: "slipAuth",
  },
  // Default configuration options of the Nuxt module
  defaults: {
    database: {
      dialect: "better-sqlite3",
      nitroDatabaseName: "default",
    },
    sessionMaxAge: 60 * 60 * 24 * 7, // 7 days
    tableNames: defaultTableNames,
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    await installModule("nuxt-auth-utils");

    // #region use private runtime config to expose options in nitro
    const runtimeConfig = nuxt.options.runtimeConfig;
    runtimeConfig.slipAuth = options;
    runtimeConfig.slipAuthIpInfoToken = "";
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

    addServerHandler({
      route: routerRecord.register,
      handler: resolver.resolve("./runtime/h3/routes/register.post.ts"),
    });
    addServerHandler({
      route: routerRecord.login,
      handler: resolver.resolve("./runtime/h3/routes/login.post.ts"),
    });
    addServerHandler({
      route: routerRecord.askEmailVerificationCode,
      handler: resolver.resolve("./runtime/h3/routes/ask-email-verification.post.ts"),
    });
    addServerHandler({
      route: routerRecord.verifyEmailVerificationCode,
      handler: resolver.resolve("./runtime/h3/routes/verify-email-verification.post.ts"),
    });
    addImportsDir(resolver.resolve("./runtime/nuxt/app/utils"));
  },
});
