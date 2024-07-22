import { SlipAuth } from "@slip/core"

export default defineNitroPlugin(async (nitroApp) => {
  const db = useDatabase();

  await db.sql`DROP TABLE IF EXISTS users`;
  await db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL)`;
  await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES user(id))`;

  const Auth = new SlipAuth(db, "sqlite");
  console.log({ Auth });
  

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