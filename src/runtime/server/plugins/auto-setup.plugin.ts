import { useSlipAuth } from "../utils/useSlipAuth";
import type { NitroApp } from "nitropack/types";
import {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore yolo the DX is not great
  defineNitroPlugin,
  useRuntimeConfig,
  // @ts-expect-error experimental feature
  useDatabase,
} from "#imports";
import type { SlipModuleOptions } from "../../types";

export default defineNitroPlugin(async (nitro: NitroApp) => {
  const config: SlipModuleOptions = useRuntimeConfig().slipAuth;
  const db = useDatabase(config.database.nitroDatabaseName);

  // https://hub.nuxt.com/docs/recipes/hooks#onhubready
  // @ts-expect-error @nuxthub/core compatibility
  if (typeof onHubReady !== "undefined" && import.meta.dev) {
    // @ts-expect-error @nuxthub/core compatibility
    onHubReady(async () => {
      await seedSqliteDatabase();
    });
  }
  else {
    await seedSqliteDatabase();
  }

  async function seedSqliteDatabase() {
    if (config.database.dialect === "sqlite" || config.database.dialect === "libsql" || config.database.dialect === "bun-sqlite" || config.database.dialect === "cloudflare-d1" || config.database.dialect === "better-sqlite3" || config.database.dialect === "node-sqlite" || config.database.dialect === "sqlite3") {
      await db.prepare(`
      CREATE TABLE IF NOT EXISTS ${config.tableNames.users} (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "email_verified" BOOLEAN DEFAULT FALSE,
        "password" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`).run();

      await db.prepare(`
      CREATE TABLE IF NOT EXISTS ${config.tableNames.sessions} (
        "id" TEXT NOT NULL PRIMARY KEY,
        "expires_at" INTEGER NOT NULL,
        "ip" TEXT, "ua" TEXT,
        "user_id" TEXT NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES ${config.tableNames.users}(id)
      )`).run();

      await db.prepare(`
      CREATE TABLE IF NOT EXISTS ${config.tableNames.oauthAccounts} (
        "provider_id" TEXT NOT NULL,
        "provider_user_id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (provider_id, provider_user_id),
        FOREIGN KEY (user_id) REFERENCES ${config.tableNames.users}(id)
      )`).run();

      await db.prepare(`
      CREATE TABLE IF NOT EXISTS ${config.tableNames.emailVerificationCodes} (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "user_id" TEXT NOT NULL UNIQUE,
        "email" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES ${config.tableNames.users}(id)
      )`).run();

      await db.prepare(`
      CREATE TABLE IF NOT EXISTS ${config.tableNames.resetPasswordTokens} (
        "token_hash" TEXT NOT NULL PRIMARY KEY,
        "user_id" TEXT NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES ${config.tableNames.users}(id)
      )`).run();

      nitro.hooks.hookOnce("request", () => {
        useSlipAuth().checkDbAndTables(config.database.dialect);
      });
    }
  }
});
