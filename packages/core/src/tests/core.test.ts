import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import sqlite from "db0/connectors/better-sqlite3";
import { createDatabase } from "db0";
import { SlipAuthCore } from "../core";

const db = createDatabase(sqlite({}));
const auth = new SlipAuthCore(db, {
  users: "slip_users",
  sessions: "slip_sessions",
  oauthAccounts: "slip_oauth_accounts",
});

beforeEach(async () => {
  await db.sql`DROP TABLE IF EXISTS slip_oauth_accounts`;
  await db.sql`DROP TABLE IF EXISTS slip_sessions`;
  await db.sql`DROP TABLE IF EXISTS slip_users`;

  await db.sql`CREATE TABLE IF NOT EXISTS slip_users ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL)`;
  await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES slip_users(id))`;
  await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" TEXT NOT NULL, "provider_user_id" TEXT NOT NULL, "user_id" TEXT NOT NULL, PRIMARY KEY (provider_id, provider_user_id), FOREIGN KEY (user_id) REFERENCES slip_users(id))`;
});

const defaultInsert = {
  email: "email@test.com",
  providerId: "github",
  providerUserId: "j3dçd9dx/2#",
};

describe("SlipAuthCore", () => {
  it("should insert when database has no users", async () => {
    const inserted = await auth.registerUserIfMissingInDb(defaultInsert);
    expect(inserted).toBe(true);
    expect(db.prepare("SELECT * from slip_users").all()).resolves.toHaveLength(
      1,
    );
  });

  it("should insert when database has no users", async () => {
    const inserted = await auth.registerUserIfMissingInDb(defaultInsert);
    expect(inserted).toBe(true);
    expect(db.prepare("SELECT * from slip_users").all()).resolves.toHaveLength(
      1,
    );
  });

  it("should throw an error when registering a user with an email in the database and a different provider", async () => {
    const inserted = await auth.registerUserIfMissingInDb(defaultInsert);
    const inserted2 = auth.registerUserIfMissingInDb({
      email: defaultInsert.email,
      providerId: "discord",
      providerUserId: "jioazdjuadiadaogfoz",
    });
    expect(inserted).toBe(true);
    expect(inserted2).rejects.toThrowError(
      "user already have an account with another provider",
    );
  });

  it("should insert twice when database users have different emails", async () => {
    const inserted = await auth.registerUserIfMissingInDb(defaultInsert);
    const inserted2 = await auth.registerUserIfMissingInDb({
      email: "email2@test.com",
      providerUserId: "azdjazoodncazd",
      providerId: defaultInsert.providerId,
    });
    expect(inserted).toBe(true);
    expect(inserted2).toBe(true);
    expect(db.prepare("SELECT * from slip_users").all()).resolves.toHaveLength(
      2,
    );
  });
});