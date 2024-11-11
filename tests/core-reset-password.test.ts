import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import sqlite from "db0/connectors/better-sqlite3";
import { createDatabase } from "db0";
import { drizzle } from "db0/integrations/drizzle";
import { SlipAuthCore } from "../src/runtime/core/core";
import { autoSetupTestsDatabase, createH3Event, testTablesNames } from "./test-helpers";
import { eq } from "drizzle-orm";

const date = new Date(Date.UTC(1998, 11, 19));

const db = createDatabase(sqlite({
  name: "core-reset-password.test",
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
    resetPasswordTokenCount: 0,
  };
});

let auth: SlipAuthCore;

describe("Reset password", () => {
  beforeEach(() => {
    mocks.userCreatedCount = 0;
    mocks.sessionCreatedCount = 0;
    mocks.passwordCount = 0;
    mocks.resetPasswordTokenCount = 0;

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

    auth.setters.setCreateResetPasswordTokenHashMethod(async () => {
      mocks.resetPasswordTokenCount++;
      return `reset-password-token-${mocks.resetPasswordTokenCount}`;
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

  describe("ask update user password", () => {
    beforeAll(() => {
      vi.useFakeTimers();
      vi.setSystemTime(date);
    });

    it("should throw an error when asking password reset of non-existant user", async () => {
      const askResetPasswordPromise = auth.askPasswordReset(createH3Event(), { userId: "notexisting" });

      expect(askResetPasswordPromise).rejects.toThrowError(
        expect.objectContaining({
          slipErrorName: "InvalidUserIdToResetPasswordError",
        }),
      );
    });

    it("should create a token and hook when asking password reset of user", async () => {
      const [userId] = await auth.register(createH3Event(), defaultInsert);

      const resetPasswordTokenCreatedHookPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject("TIMEOUT"), 1000);
        auth.hooks.hookOnce("resetPasswordToken:create", (token) => {
          resolve(token);
        });
      });

      const askResetPasswordPromise = auth.askPasswordReset(createH3Event(), { userId });

      expect(resetPasswordTokenCreatedHookPromise).resolves.toMatchObject({
        user_id: "user-id-1",
        expires_at: "1998-12-19 02:00:00",
        token_hash: "reset-password-token-1",
      });

      expect(askResetPasswordPromise).resolves.toBeTypeOf("string");
    });
  });

  describe("ask forgotten password", () => {
    it("should throw an error when asking forgotten password of non-existant user", async () => {
      const askForgottenPasswordPromise = auth.askForgotPasswordReset(createH3Event(), { emailAddress: "notexisting@mail" });

      expect(askForgottenPasswordPromise).rejects.toThrowError(
        expect.objectContaining({
          slipErrorName: "InvalidEmailToResetPasswordError",
        }),
      );
    });

    it("should create a token and hook when asking forgot password of user", async () => {
      await auth.register(createH3Event(), defaultInsert);

      const resetPasswordTokenCreatedHookPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject("TIMEOUT"), 1000);
        auth.hooks.hookOnce("resetPasswordToken:create", (token) => {
          resolve(token);
        });
      });

      const askForgottenPasswordPromise = auth.askForgotPasswordReset(createH3Event(), { emailAddress: defaultInsert.email });

      expect(resetPasswordTokenCreatedHookPromise).resolves.toMatchObject({
        user_id: "user-id-1",
        expires_at: "1998-12-19 02:00:00",
        token_hash: "reset-password-token-1",
      });

      expect(askForgottenPasswordPromise).resolves.toBeTypeOf("string");
    });
  });

  describe("validate reset password token", () => {
    it("should throw error with invalid password value", () => {
      // @ts-expect-error testing value
      const checkPassword = auth.resetPasswordWithResetToken(createH3Event(), { verificationToken: Date() });
      expect(checkPassword).rejects.toThrowError(
        expect.objectContaining({
          slipErrorName: "InvalidPasswordToResetError",
        }),
      );
    });

    it("should throw error with not-existing token", async () => {
      const checkPassword = auth.resetPasswordWithResetToken(createH3Event(), { verificationToken: "okokok", newPassword: defaultInsert.password });
      expect(checkPassword).rejects.toThrowError(
        expect.objectContaining({
          slipErrorName: "ResetPasswordTokenExpiredError",
        }),
      );
    });

    it("should throw error with expired token", async () => {
      const [userId] = await auth.register(createH3Event(), defaultInsert);
      const token = await auth.askPasswordReset(createH3Event(), { userId });

      // jump in time to expire token
      vi.setSystemTime(new Date(date.getTime() + date.getTime()));

      const checkPassword = auth.resetPasswordWithResetToken(createH3Event(), { verificationToken: token, newPassword: defaultInsert.password });
      expect(checkPassword).rejects.toThrowError(
        expect.objectContaining({
          slipErrorName: "ResetPasswordTokenExpiredError",
        }),
      );
    });

    it("should delete all previous tokens and sessions of requested user", async () => {
      await auth.register(createH3Event(), defaultInsert);
      const [userId] = await auth.login(createH3Event(), defaultInsert);

      const resetPasswordTokenDeleteddHookPromise = new Promise((resolve, reject) => {
        setTimeout(() => reject("TIMEOUT"), 1000);
        auth.hooks.hookOnce("resetPasswordToken:delete", (token) => {
          resolve(token);
        });
      });

      let tokenCatchedByHooks = {};
      auth.hooks.hookOnce("resetPasswordToken:create", token => tokenCatchedByHooks = token);

      const token = await auth.askPasswordReset(createH3Event(), { userId });
      const orm = drizzle(db);

      // decrement to match previously generated token
      mocks.resetPasswordTokenCount--;
      const checkPassword = auth.resetPasswordWithResetToken(createH3Event(), { verificationToken: token, newPassword: defaultInsert.password });
      await expect(checkPassword).resolves.toBe(true);

      await expect(resetPasswordTokenDeleteddHookPromise).resolves.toStrictEqual(tokenCatchedByHooks);

      const userSessions = await orm.select().from(auth.schemas.sessions).where(eq(auth.schemas.sessions.user_id, userId));
      expect(userSessions).toHaveLength(0);

      const userResetPasswordToken = await orm.select().from(auth.schemas.resetPasswordTokens).where(eq(auth.schemas.resetPasswordTokens.user_id, userId));
      expect(userResetPasswordToken).toHaveLength(0);
    });
  });
});
