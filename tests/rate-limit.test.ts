import { describe, it, expect, vi, beforeEach } from "vitest";
import sqlite from "db0/connectors/better-sqlite3";
import { createDatabase } from "db0";
import { SlipAuthCore } from "../src/runtime/core/core";
import { autoSetupTestsDatabase, createH3Event, testTablesNames } from "./test-helpers";
import { EmailVerificationFailedError, InvalidEmailOrPasswordError, RateLimitAskEmailVerificationError, RateLimitAskResetPasswordError, RateLimitLoginError, RateLimitVerifyEmailVerificationError } from "../src/runtime/core/errors/SlipAuthError";
import { createThrottlerStorage } from "../src/runtime/core/rate-limit/Throttler";

const db = createDatabase(sqlite({
  name: "rate-limit.test",
}));

let auth: SlipAuthCore;

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

describe("rate limit", () => {
  beforeEach(async () => {
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

  describe("login", () => {
    const loginTestStorage = createThrottlerStorage();

    beforeEach(async () => {
      await loginTestStorage.clear();
      auth.setters.setLoginRateLimiter(() => loginTestStorage);
    });

    it("should allow 2 failed tries", async () => {
      await auth.register(createH3Event(), defaultInsert);
      const doAttempt = () => auth.login(createH3Event(), {
        email: defaultInsert.email,
        password: defaultInsert.password + "123",
      });

      const t1 = doAttempt();
      await expect(t1).rejects.toBeInstanceOf(InvalidEmailOrPasswordError);
      // will not rate-limit because timeout is 0
      const t2 = doAttempt();
      await expect(t2).rejects.toBeInstanceOf(InvalidEmailOrPasswordError);
    });

    it("should rate-limit 3 failed tries", async () => {
      await auth.register(createH3Event(), defaultInsert);
      const doAttempt = () => auth.login(createH3Event(), {
        email: defaultInsert.email,
        password: defaultInsert.password + "123",
      });

      const t1 = doAttempt();
      await expect(t1).rejects.toBeInstanceOf(InvalidEmailOrPasswordError);

      // will not rate-limit because timeout is 0
      const t2 = doAttempt();
      await expect(t2).rejects.toBeInstanceOf(InvalidEmailOrPasswordError);

      const t3 = doAttempt();
      await expect(t3).rejects.toBeInstanceOf(RateLimitLoginError);
    });

    it("should increment timeout", async () => {
      await auth.register(createH3Event(), defaultInsert);
      const doAttempt = () => auth.login(createH3Event(), {
        email: defaultInsert.email,
        password: defaultInsert.password + "123",
      });
      vi.useFakeTimers();

      const t1 = doAttempt();
      await expect(t1).rejects.toBeInstanceOf(InvalidEmailOrPasswordError);
      // will not rate-limit because timeout is 0
      const t2 = doAttempt();
      await expect(t2).rejects.toBeInstanceOf(InvalidEmailOrPasswordError);

      const t3 = await doAttempt().catch(e => JSON.parse(JSON.stringify(e)));
      expect(t3).toMatchObject({ data: { msBeforeNext: 1000 } });

      vi.advanceTimersByTime(1000);

      // not rate-limited because after timeout of 1000
      const t4 = doAttempt();
      await expect(t4).rejects.toBeInstanceOf(InvalidEmailOrPasswordError);

      const t5 = await doAttempt().catch(e => JSON.parse(JSON.stringify(e)));
      expect(t5).toMatchObject({ data: { msBeforeNext: 2000 } });

      // use previous timeout
      vi.advanceTimersByTime(500);
      const t6 = await doAttempt().catch(e => JSON.parse(JSON.stringify(e)));
      expect(t6).toMatchObject({ data: { msBeforeNext: 1500 } });
    });
  });

  describe("ask email verification", () => {
    const askEmailVerificationTestStorage = createThrottlerStorage();

    beforeEach(async () => {
      await askEmailVerificationTestStorage.clear();
      auth.setters.setAskEmailRateLimiter(() => askEmailVerificationTestStorage);
    });

    it("should rate-limit", async () => {
      const [userId] = await auth.register(createH3Event(), defaultInsert);
      const user = (await auth.getUser({ userId }))!;
      const doAttempt = () => auth.askEmailVerificationCode(createH3Event(), { user });

      vi.useFakeTimers();

      const t1 = await doAttempt();
      expect(t1).not.toBeInstanceOf(Error);

      const t2 = doAttempt();
      await expect(t2).rejects.toBeInstanceOf(RateLimitAskEmailVerificationError);

      vi.advanceTimersByTime(2000);

      const t3 = await doAttempt();
      expect(t3).not.toBeInstanceOf(Error);

      const t4 = await doAttempt().catch(e => JSON.parse(JSON.stringify(e)));
      expect(t4).toMatchObject({
        data: {
          msBeforeNext: 4000,
        },
      });
    });
  });

  describe("verify reset password", () => {
    const verifyEmailVerificationTestStorage = createThrottlerStorage();
    const askEmailVerificationTestStorage = createThrottlerStorage();

    beforeEach(async () => {
      await verifyEmailVerificationTestStorage.clear();
      await askEmailVerificationTestStorage.clear();
      auth.setters.setAskEmailRateLimiter(() => askEmailVerificationTestStorage);
      auth.setters.setVerifyEmailRateLimiter(() => verifyEmailVerificationTestStorage);
    });

    it("should rate-limit", async () => {
      auth.setters.setCreateRandomEmailVerificationCode(() => "123456");
      vi.useFakeTimers();

      const [userId] = await auth.register(createH3Event(), defaultInsert);
      const user = (await auth.getUser({ userId }))!;
      const doAttempt = async () => {
        await askEmailVerificationTestStorage.clear();
        await auth.askEmailVerificationCode(createH3Event(), { user });
        await askEmailVerificationTestStorage.clear();
        return auth.verifyEmailVerificationCode(createH3Event(), {
          user: {
            ...user,
            email: "wrong-email",
          },
          code: "123456",
        });
      };

      const t1 = doAttempt();
      await expect(t1).rejects.toBeInstanceOf(EmailVerificationFailedError);

      // will not rate-limit because timeout is 0
      const t2 = doAttempt();
      await expect(t2).rejects.toBeInstanceOf(EmailVerificationFailedError);

      const t3 = doAttempt();
      await expect(t3).rejects.toBeInstanceOf(RateLimitVerifyEmailVerificationError);

      vi.advanceTimersByTime(1000);

      // will not rate-limit timeout is expired
      const t4 = doAttempt();
      await expect(t4).rejects.toBeInstanceOf(EmailVerificationFailedError);

      const t5 = await doAttempt().catch(e => JSON.parse(JSON.stringify(e)));
      expect(t5).toMatchObject({
        data: {
          msBeforeNext: 2000,
        },
      });
    });
  });

  describe("ask reset password", () => {
    const askResetPasswordTestStorage = createThrottlerStorage();

    beforeEach(async () => {
      await askResetPasswordTestStorage.clear();
      auth.setters.setAskResetPasswordRateLimiter(() => askResetPasswordTestStorage);
    });

    it("should rate-limit", async () => {
      const [userId] = await auth.register(createH3Event(), defaultInsert);
      const doAttempt = () => auth.askPasswordReset(createH3Event(), { userId });

      vi.useFakeTimers();

      const t1 = await doAttempt();
      expect(t1).not.toBeInstanceOf(Error);

      const t2 = await doAttempt();
      expect(t2).not.toBeInstanceOf(Error);

      const t3 = doAttempt();
      await expect(t3).rejects.toBeInstanceOf(RateLimitAskResetPasswordError);

      vi.advanceTimersByTime(2000);

      const t4 = await doAttempt();
      expect(t4).not.toBeInstanceOf(Error);

      const t5 = await doAttempt().catch(e => JSON.parse(JSON.stringify(e)));
      expect(t5).toMatchObject({
        data: {
          msBeforeNext: 4000,
        },
      });
    });
  });
});
