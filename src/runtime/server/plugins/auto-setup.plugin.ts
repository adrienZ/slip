import { useSlipAuth } from "../utils/useSlipAuth";
import type { NitroApp } from "nitropack";
import {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore yolo the DX is not great
  defineNitroPlugin,
  useRuntimeConfig,
  // @ts-expect-error experimental feature
  useDatabase,
} from "#imports";

export default defineNitroPlugin(async (nitro: NitroApp) => {
  const config = useRuntimeConfig();
  const db = useDatabase(config.slipAuth.database.nitroDatabaseName);

  if (config.slipAuth.database.dialect === "sqlite" || config.slipAuth.database.dialect === "libsql" || config.slipAuth.database.dialect === "bun-sqlite") {
    await db.sql`CREATE TABLE IF NOT EXISTS slip_auth_users ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL UNIQUE, "email_verified" BOOLEAN NOT NULL DEFAULT 0, "password" TEXT, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`;
    await db.sql`CREATE TABLE IF NOT EXISTS slip_auth_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "ip" TEXT, "ua" TEXT, "user_id" TEXT NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES slip_auth_users(id))`;
    await db.sql`CREATE TABLE IF NOT EXISTS slip_auth_oauth_accounts ("provider_id" TEXT NOT NULL, "provider_user_id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY (provider_id, provider_user_id), FOREIGN KEY (user_id) REFERENCES slip_auth_users(id))`;
    nitro.hooks.hookOnce("request", () => {
      useSlipAuth().checkDbAndTables(config.slipAuth.database.dialect);
    });
  }
});
