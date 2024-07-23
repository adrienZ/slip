import { SlipAuthCore } from "@slip/core"
import {  createAuthRoutes } from "../../lib/nitro"

export default defineNitroPlugin(async (nitroApp) => {
  const db = useDatabase();

  await db.sql`DROP TABLE IF EXISTS users`;
  await db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL)`;
  await db.sql`CREATE TABLE IF NOT EXISTS sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES user(id))`;

  const slip = new SlipAuthCore(db, "sqlite", {
    users: "users",
    sessions: "sessions"
  })

  createAuthRoutes(nitroApp.router, slip);

  nitroApp.router.add("/users", defineEventHandler(async event => {
    // Query for users
    const { rows } = await db.sql`SELECT * FROM users`;

    return {
      rows,
    };
  }), "get")
})