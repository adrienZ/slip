import memoryDriver from "unstorage/drivers/memory";

export default defineNitroPlugin(async () => {
  const db = useDatabase();

  await db.sql`CREATE TABLE IF NOT EXISTS slip_auth_users ("id" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP PRIMARY KEY, "email" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP UNIQUE, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`;
  await db.sql`CREATE TABLE IF NOT EXISTS slip_auth_sessions ("id" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP PRIMARY KEY, "expires_at" INTEGER NOT NULL, "ip" TEXT, "ua" TEXT, "user_id" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES slip_auth_users(id))`;
  await db.sql`CREATE TABLE IF NOT EXISTS slip_auth_oauth_accounts ("provider_id" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, "provider_user_id" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, "user_id" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY (provider_id, provider_user_id), FOREIGN KEY (user_id) REFERENCES slip_auth_users(id))`;

  const memoryCache = useStorage().mount("slipAuthInMemory", memoryDriver());
  const slipDatabaseVerifiedKey = "slipDatabaseVerified";
  if (await memoryCache.getItem(slipDatabaseVerifiedKey) === null) {
    const databaseSchemaValidation = await useSlipAuth().checkDbAndTables("sqlite");
    memoryCache.setItem(slipDatabaseVerifiedKey, databaseSchemaValidation);
  };
});
