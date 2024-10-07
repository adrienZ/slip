import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import sqlite from "db0/connectors/better-sqlite3";
import { createDatabase } from "db0";
import { SlipAuthCore } from "../src/runtime/core/core";
import type { SlipAuthUser } from "~/src/runtime/core/types";
import { autoSetupTestsDatabase, createH3Event, testTablesNames } from "./test-helpers";
import { EmailVerificationFailedError } from "../src/runtime/core/errors/SlipAuthError";

const date = new Date(Date.UTC(1998, 11, 19));

const db = createDatabase(sqlite({
  name: "core-email-password.test",
}));

beforeEach(async () => {
  await autoSetupTestsDatabase(db);
});

const defaultInsert = {
  email: "email@test.com",
  password: "pa$$word",
};

const mocks = vi.hoisted(() => {
  return {
    userCreatedCount: 0,
    sessionCreatedCount: 0,
    passwordCount: 0,
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

    function sanitizePassword(str: string) {
      return str.replaceAll("$", "") + "$";
    }
    auth.setters.setPasswordHashingMethods(() => ({
      hash: async (password: string) => sanitizePassword(password) + mocks.passwordCount,
      verify: async (sourceHashedPassword: string, rawPassword: string) => {
        const salt = sourceHashedPassword.split("$").at(-1);
        if (!salt) {
          return false;
        }
        return sourceHashedPassword === sanitizePassword(rawPassword) + salt;
      },
    }),
    );
  });

  describe("register", () => {
    beforeAll(() => {
      vi.useFakeTimers();
      vi.setSystemTime(date);
    });

    it("should throw an error when registering a user with an email in the database and a different provider", async () => {
      const [_, inserted] = await auth.register(createH3Event(), defaultInsert);
      const inserted2 = auth.register(createH3Event(), {
        email: defaultInsert.email,
        password: "password",
      });

      expect(inserted).toMatchObject(mockedCreateSession);
      expect(inserted2).rejects.toThrowError(
        expect.objectContaining({
          slipErrorName: "InvalidEmailOrPasswordError",
        }),
      );
    });

    it("should insert twice when database users have different emails", async () => {
      const [_, inserted] = await auth.register(createH3Event(), defaultInsert);
      const [__, inserted2] = await auth.register(createH3Event(), {
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

      const emailVerificationCodeCreatedHookPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject("TIMEOUT"), 1000);
        auth.hooks.hookOnce("emailVerificationCode:create", values => resolve(values));
      });

      const [_, inserted] = await auth.register(createH3Event(), defaultInsert);

      expect(userCreatedHookPromise).resolves.toMatchObject({
        email: defaultInsert.email,
        id: "user-id-1",
      });

      expect(sessionCreatedHookPromise).resolves.toBe(inserted);
      expect(emailVerificationCodeCreatedHookPromise).resolves.toMatchObject({
        user_id: mockedCreateSession.user_id,
        email: defaultInsert.email,
      });

      const resolvedEmailVerificationCode = await emailVerificationCodeCreatedHookPromise as { code: unknown, expires_at: unknown };
      expect(resolvedEmailVerificationCode.expires_at).toBeInstanceOf(Date);
      expect(resolvedEmailVerificationCode.code).toBeTypeOf("string");
    });

    it("should only hook \"sessions:create\" when login an existing user", async () => {
      // register
      const [_, registerSession] = await auth.register(createH3Event(), defaultInsert);
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

      // login
      const [__, loginSession] = await auth.login(createH3Event(), defaultInsert);

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
      const [_, registerSession] = await auth.register(createH3Event(), defaultInsert);
      // logout
      auth.deleteSession({ sessionId: registerSession.id });

      expect(sessionDeletedHookPromise).resolves.toStrictEqual(registerSession);
    });
  });

  describe("email verification code", () => {
    beforeAll(() => {
      vi.useRealTimers();
    });

    it("should not validate token from another user", async () => {
      const codes: Array<{ code: string }> = [];

      auth.hooks.hook("emailVerificationCode:create", values => codes.push(values));

      const defaultInsert2 = {
        ...defaultInsert,
        email: defaultInsert.email + "2",
      };

      const [userId1] = await auth.register(createH3Event(), defaultInsert);
      const [userId2] = await auth.register(createH3Event(), defaultInsert2);

      expect(codes).toHaveLength(2);

      const fakeUser2Data = {
        id: userId2,
        email: defaultInsert2.email,
      };
      const verification1 = auth.verifyEmailVerificationCode(createH3Event(), { user: fakeUser2Data as SlipAuthUser, code: codes[0].code });
      await expect(verification1).rejects.toBeInstanceOf(EmailVerificationFailedError);

      const fakeUser1Data = {
        id: userId1,
        email: defaultInsert.email,
      };
      const verification2 = auth.verifyEmailVerificationCode(createH3Event(), { user: fakeUser1Data as SlipAuthUser, code: codes[1].code });
      await expect(verification2).rejects.toBeInstanceOf(EmailVerificationFailedError);
    });

    it("should validate token from intended user", async () => {
      const codes: Array<{ code: string }> = [];

      auth.hooks.hook("emailVerificationCode:create", values => codes.push(values));

      const [userId] = await auth.register(createH3Event(), defaultInsert);
      const fakeUserData = {
        id: userId,
        email: defaultInsert.email,
      };

      const verification = await auth.verifyEmailVerificationCode(createH3Event(), { user: fakeUserData as SlipAuthUser, code: codes[0].code });

      expect(verification).toBe(true);

      const dbUser = await auth.getUser({ userId });
      expect(dbUser?.email_verified).toBe(1);
    });
  });
});
