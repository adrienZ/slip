export default defineNitroPlugin(async () => {
  const db = useDatabase();

  await db.sql`CREATE TABLE IF NOT EXISTS slip_auth_users ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL)`;
  await db.sql`CREATE TABLE IF NOT EXISTS slip_auth_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES slip_auth_users(id))`;
  await db.sql`CREATE TABLE IF NOT EXISTS slip_auth_oauth_accounts ("provider_id" TEXT NOT NULL, "provider_user_id" TEXT NOT NULL, "user_id" TEXT NOT NULL, PRIMARY KEY (provider_id, provider_user_id), FOREIGN KEY (user_id) REFERENCES slip_auth_users(id))`;

  useSlipAuth().checkDbAndTables("sqlite");
});
