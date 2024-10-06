import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import sqlite from "db0/connectors/better-sqlite3";
import { createDatabase } from "db0";
import { SlipAuthCore } from "../src/runtime/core/core";
import { autoSetupTestsDatabase, createH3Event, testTablesNames } from "./test-helpers";
import { InvalidEmailOrPasswordError, RateLimitLoginError } from "../src/runtime/core/errors/SlipAuthError";
import { createThrottlerStorage } from "../src/runtime/core/rate-limit/Throttler";

const testStorage = createThrottlerStorage();

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

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe.sequential("rate limit", () => {
  afterAll(
    async () => {
    // await testStorage.clear();
      await testStorage.dispose();
    });

  beforeEach(async () => {
    mocks.userCreatedCount = 0;
    mocks.sessionCreatedCount = 0;
    await testStorage.clear();

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

    auth.setters.setLoginRateLimiter(() => testStorage);

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
});
