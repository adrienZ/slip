import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import sqlite from "db0/connectors/better-sqlite3";
import { createDatabase } from "db0";
import { SlipAuthCore } from "../src/runtime/core/core";

const date = new Date(Date.UTC(1998, 11, 19));

const db = createDatabase(sqlite({
  name: "core-email-password.test",
}));

beforeEach(async () => {
  await db.sql`DROP TABLE IF EXISTS slip_oauth_accounts`;
  await db.sql`DROP TABLE IF EXISTS slip_sessions`;
  await db.sql`DROP TABLE IF EXISTS slip_users`;

  await db.sql`CREATE TABLE IF NOT EXISTS slip_users ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL UNIQUE, "password" TEXT, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`;
  await db.sql`CREATE TABLE IF NOT EXISTS slip_sessions ("id" TEXT NOT NULL PRIMARY KEY, "expires_at" INTEGER NOT NULL, "user_id" TEXT NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "ip" TEXT, "ua" TEXT, FOREIGN KEY (user_id) REFERENCES slip_users(id))`;
  await db.sql`CREATE TABLE IF NOT EXISTS slip_oauth_accounts ("provider_id" TEXT NOT NULL, "provider_user_id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (provider_id, provider_user_id), FOREIGN KEY (user_id) REFERENCES slip_users(id))`;
});

const defaultInsert = {
  email: "email@test.com",
  password: "password",
};

const mocks = vi.hoisted(() => {
  return {
    userCreatedCount: 0,
    sessionCreatedCount: 0,
  };
});

const mockedCreateSession = {
  expires_at: 914630400000,
  id: "session-id-1",
  user_id: "user-id-1",
  ip: null,
  ua: null,
};

let auth: SlipAuthCore;

describe("SlipAuthCore", () => {
  beforeEach(() => {
    mocks.userCreatedCount = 0;
    mocks.sessionCreatedCount = 0;

    auth = new SlipAuthCore(
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

    auth.setCreateRandomUserId(() => {
      mocks.userCreatedCount++;
      return `user-id-${mocks.userCreatedCount}`;
    });

    auth.setCreateRandomSessionId(() => {
      mocks.sessionCreatedCount++;
      return `session-id-${mocks.sessionCreatedCount}`;
    });
  });

  describe("register", () => {
    beforeAll(() => {
      vi.useFakeTimers();
      vi.setSystemTime(date);
    });

    it("should throw an error when registering a user with an email in the database and a different provider", async () => {
      const [_, inserted] = await auth.register(defaultInsert);
      const inserted2 = auth.register({
        email: defaultInsert.email,
        password: "password",
      });

      expect(inserted).toMatchObject(mockedCreateSession);
      expect(inserted2).rejects.toThrowError(
        "InvalidEmailOrPasswordError",
      );
    });

    it("should insert twice when database users have different emails", async () => {
      const [_, inserted] = await auth.register(defaultInsert);
      const [__, inserted2] = await auth.register({
        email: "email2@test.com",
        password: "password",
      });
      expect(inserted).toMatchObject(mockedCreateSession);
      expect(inserted2).toMatchObject({
        expires_at: 914630400000,
        id: "session-id-2",
        user_id: "user-id-2",
      });
      expect(
        db.prepare("SELECT * from slip_users").all(),
      ).resolves.toHaveLength(2);
    });
  });

  describe("hooks", () => {
    beforeAll(() => {
      vi.useRealTimers();
    });

    it("should trigger hooks when registering a new user", async () => {
      const userCreatedHookPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject("TIMEOUT"), 1000);
        auth.hooks.hookOnce("users:create", (user) => {
          resolve(user);
        });
      });

      const sessionCreatedHookPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject("TIMEOUT"), 1000);
        auth.hooks.hookOnce("sessions:create", (session) => {
          resolve(session);
        });
      });

      const [_, inserted] = await auth.register(defaultInsert);

      expect(userCreatedHookPromise).resolves.toMatchObject({
        email: defaultInsert.email,
        id: "user-id-1",
      });

      expect(sessionCreatedHookPromise).resolves.toBe(inserted);
    });

    it("should only hook \"sessions:create\" when login an existing user", async () => {
      // register
      const [_, registerSession] = await auth.register(defaultInsert);
      // logout
      auth.deleteSession(registerSession.id);

      const userCreatedHookPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject("TIMEOUT"), 2000);
        auth.hooks.hookOnce("users:create", (user) => {
          resolve(user);
        });
      });

      const sessionCreatedHookPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject("TIMEOUT"), 2000);
        auth.hooks.hookOnce("sessions:create", (session) => {
          resolve(session);
        });
      });

      // login
      const [__, loginSession] = await auth.login(defaultInsert);

      expect(userCreatedHookPromise).rejects.toBe("TIMEOUT");
      expect(sessionCreatedHookPromise).resolves.toMatchObject(loginSession);
    });

    it("should only hook \"sessions:delete\" on logout", async () => {
      const sessionDeletedHookPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject("TIMEOUT"), 2000);
        auth.hooks.hookOnce("sessions:delete", (session) => {
          resolve(session);
        });
      });

      // register
      const [_, registerSession] = await auth.register(defaultInsert);
      // logout
      auth.deleteSession(registerSession.id);

      expect(sessionDeletedHookPromise).resolves.toStrictEqual(registerSession);
    });
  });
});