import { checkDbAndTables } from "@slip/database";

export default defineNitroPlugin(async (nitroApp) => {
  const db = useDatabase();

  await db.sql`DROP TABLE IF EXISTS users`;
  await db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT PRIMARY KEY, "email" TEXT)`;

  checkDbAndTables(db, "sqlite");

  nitroApp.router.add("/auth/register", defineEventHandler(async event => {
    // Add a new user
    const userId = String(Math.round(Math.random() * 10_000));
    await db.sql`INSERT INTO users VALUES (${userId}, 'test@test.mail')`;

    // Query for users
    const { rows } = await db.sql`SELECT * FROM users WHERE id = ${userId}`;

    return {
      rows,
    };
  }), "get")


  nitroApp.router.add("/auth/users", defineEventHandler(async event => {
    // Query for users
    const { rows } = await db.sql`SELECT * FROM users`;

    return {
      rows,
    };
  }), "get")
})