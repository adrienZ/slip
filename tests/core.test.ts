import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import sqlite from "db0/connectors/better-sqlite3";
import { createDatabase } from "db0";
import { SlipAuthCore } from "../src/runtime/core/core";
import { autoSetupTestsDatabase, testTablesNames } from "./test-helpers";

const date = new Date(Date.UTC(1998, 11, 19));

const db = createDatabase(sqlite({
  name: "core.test",
}));

beforeEach(async () => {
  await autoSetupTestsDatabase(db);
});

const defaultInsert = {
  email: "email@test.com",
  providerId: "github",
  providerUserId: "github:user:id",
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
      testTablesNames,
      {
        sessionMaxAge: 60 * 60 * 24 * 7, // 7 days
      },
    );

    auth.setters.setCreateRandomUserId(() => {
      mocks.userCreatedCount++;
      return `user-id-${mocks.userCreatedCount}`;
    });

    auth.setters.setCreateRandomSessionId(() => {
      mocks.sessionCreatedCount++;
      return `session-id-${mocks.sessionCreatedCount}`;
    });
  });

  describe("users", () => {
    beforeAll(() => {
      vi.useFakeTimers();
      vi.setSystemTime(date);
    });

    it("should insert when database has no users", async () => {
      const [_, inserted] = await auth.OAuthLoginUser(defaultInsert);
      expect(inserted).toMatchObject(mockedCreateSession);
      expect(
        db.prepare("SELECT * from slip_users").all(),
      ).resolves.toHaveLength(1);
    });

    it("should insert when database has no users", async () => {
      const [_, inserted] = await auth.OAuthLoginUser(defaultInsert);
      expect(inserted).toMatchObject(mockedCreateSession);

      expect(
        db.prepare("SELECT * from slip_users").all(),
      ).resolves.toHaveLength(1);
    });
  });

  describe("register", () => {
    beforeAll(() => {
      vi.useFakeTimers();
      vi.setSystemTime(date);
    });

    it("should throw an error when registering a user with an email in the database and a different provider", async () => {
      const [_, inserted] = await auth.OAuthLoginUser(defaultInsert);
      const inserted2 = auth.OAuthLoginUser({
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
      const [_, inserted] = await auth.OAuthLoginUser(defaultInsert);
      const [__, inserted2] = await auth.OAuthLoginUser({
        email: "email2@test.com",
        providerUserId: "azdjazoodncazd",
        providerId: defaultInsert.providerId,
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

  describe("sessions", () => {
    beforeAll(() => {
      vi.useFakeTimers();
      vi.setSystemTime(date);
    });

    it("should delete an existant session", async () => {
      const [_, session] = await auth.OAuthLoginUser(defaultInsert);

      await auth.deleteSession({ sessionId: session.id });

      const notASession = await auth.getSession({ sessionId: session.id });

      expect(notASession).toBe(undefined);
    });

    it("should throw when trying to delete an non existant session", async () => {
      await auth.OAuthLoginUser(defaultInsert);

      const deletion = auth.deleteSession({ sessionId: "notInDB" });
      expect(deletion).rejects.toThrowError(
        "Unable to delete session with id notInDB",
      );
    });

    it("should delete expired sessions", async () => {
      await auth.OAuthLoginUser(defaultInsert);

      vi.useRealTimers();
      await auth.OAuthLoginUser({
        ...defaultInsert,
        email: "another-unique-email@test.com",
        providerUserId: `another-${defaultInsert.providerUserId}`,
      });

      const deletions = await auth.deleteExpiredSessions({ timestamp: Date.now() });
      expect(deletions).toStrictEqual({ success: true, count: 1 });
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

      const oAuthAccountCreatedHookPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject("TIMEOUT"), 1000);
        auth.hooks.hookOnce("oAuthAccount:create", (account) => {
          resolve(account);
        });
      });

      const [_, inserted] = await auth.OAuthLoginUser(defaultInsert);

      expect(userCreatedHookPromise).resolves.toMatchObject({
        email: defaultInsert.email,
        id: "user-id-1",
      });

      expect(oAuthAccountCreatedHookPromise).resolves.toMatchObject({
        provider_id: defaultInsert.providerId,
        provider_user_id: defaultInsert.providerUserId,
        user_id: "user-id-1",
      });

      expect(sessionCreatedHookPromise).resolves.toBe(inserted);
    });

    it("should only hook \"sessions:create\" when login an existing user", async () => {
      // register
      const [_, registerSession] = await auth.OAuthLoginUser(defaultInsert);
      // logout
      auth.deleteSession({ sessionId: registerSession.id });

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

      const oAuthAccountCreatedHookPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject("TIMEOUT"), 1000);
        auth.hooks.hookOnce("oAuthAccount:create", (account) => {
          resolve(account);
        });
      });

      // login
      const [__, loginSession] = await auth.OAuthLoginUser(defaultInsert);

      expect(userCreatedHookPromise).rejects.toBe("TIMEOUT");
      expect(oAuthAccountCreatedHookPromise).rejects.toBe("TIMEOUT");

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
      const [_, registerSession] = await auth.OAuthLoginUser(defaultInsert);
      // logout
      auth.deleteSession({ sessionId: registerSession.id });

      expect(sessionDeletedHookPromise).resolves.toStrictEqual(registerSession);
    });
  });
});
