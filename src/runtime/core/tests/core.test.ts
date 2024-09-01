import { describe, it, expect, vi, beforeEach } from "vitest";
import sqlite from "db0/connectors/better-sqlite3";
import { createDatabase } from "db0";
import { SlipAuthCore } from "../core";

const date = new Date(Date.UTC(1998, 11, 19));

vi.useFakeTimers();
vi.setSystemTime(date);

const db = createDatabase(sqlite({
  name: "core.test",
}));
const auth = new SlipAuthCore(
  db,
  {
    users: "slip_users",
    sessions: "slip_sessions",
    oauthAccounts: "slip_oauth_accounts",
  },
  {
    sessionMaxAge: 60 * 60 * 24 * 7, // 7 days
  },
);

beforeEach(async () => {
  await db.sql`DROP TABLE IF EXISTS slip_oauth_accounts`;
  await db.sql`DROP TABLE IF EXISTS slip_sessions`;
  await db.sql`DROP TABLE IF EXISTS slip_users`;

  await db.sql`CREATE TABLE IF NOT EXISTS slip_users ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`;
  await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "ip" TEXT, "ua" TEXT, FOREIGN KEY (user_id) REFERENCES slip_users(id))`;
  await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" TEXT NOT NULL, "provider_user_id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (provider_id, provider_user_id), FOREIGN KEY (user_id) REFERENCES slip_users(id))`;
});

const defaultInsert = {
  email: "email@test.com",
  providerId: "github",
  providerUserId: "j3dçd9dx/2#",
};

const mocks = vi.hoisted(() => {
  return {
    uncryptoMockCounter: 0,
  };
});

const mockedCreateSession = {
  expires_at: 914630400000,
  id: "randomUUID-2",
  user_id: "randomUUID-1",
  ip: null,
  ua: null,
};

describe("SlipAuthCore", () => {
  describe("users", () => {
    beforeEach(() => {
      mocks.uncryptoMockCounter = 0;
      vi.mock("uncrypto", () => {
        function randomUUID() {
          mocks.uncryptoMockCounter++;
          return `randomUUID-${mocks.uncryptoMockCounter}`;
        }

        return { randomUUID };
      });
    });

    it("should insert when database has no users", async () => {
      const [_, inserted] = await auth.registerUserIfMissingInDb(defaultInsert);
      expect(inserted).toMatchObject(mockedCreateSession);
      expect(
        db.prepare("SELECT * from slip_users").all(),
      ).resolves.toHaveLength(1);
    });

    it("should insert when database has no users", async () => {
      const [_, inserted] = await auth.registerUserIfMissingInDb(defaultInsert);
      expect(inserted).toMatchObject(mockedCreateSession);

      expect(
        db.prepare("SELECT * from slip_users").all(),
      ).resolves.toHaveLength(1);
    });

    it("should throw an error when registering a user with an email in the database and a different provider", async () => {
      const [_, inserted] = await auth.registerUserIfMissingInDb(defaultInsert);
      const inserted2 = auth.registerUserIfMissingInDb({
        email: defaultInsert.email,
        providerId: "discord",
        providerUserId: "jioazdjuadiadaogfoz",
      });
      expect(inserted).toMatchObject(mockedCreateSession);
      expect(inserted2).rejects.toThrowError(
        "user already have an account with another provider",
      );
    });

    it("should insert twice when database users have different emails", async () => {
      const [_, inserted] = await auth.registerUserIfMissingInDb(defaultInsert);
      const [__, inserted2] = await auth.registerUserIfMissingInDb({
        email: "email2@test.com",
        providerUserId: "azdjazoodncazd",
        providerId: defaultInsert.providerId,
      });
      expect(inserted).toMatchObject(mockedCreateSession);
      expect(inserted2).toMatchObject({
        expires_at: 914630400000,
        id: "randomUUID-4",
        user_id: "randomUUID-3",
      });
      expect(
        db.prepare("SELECT * from slip_users").all(),
      ).resolves.toHaveLength(2);
    });
  });
});
