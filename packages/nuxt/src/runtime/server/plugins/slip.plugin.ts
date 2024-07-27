import { useSlipAuth } from "../utils/slip.binding";

export default defineNitroPlugin(async (nitroApp) => {
  const db = useDatabase();

  await db.sql`DROP TABLE IF EXISTS slip_auth_users`;
  await db.sql`CREATE TABLE IF NOT EXISTS slip_auth_users ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL)`;
  await db.sql`CREATE TABLE IF NOT EXISTS slip_auth_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES user(id))`;

  // init slip to check datanase
  useSlipAuth();
});
