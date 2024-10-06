import { describe, it, expect, vi, beforeEach } from "vitest";
import sqlite from "db0/connectors/better-sqlite3";
import { createDatabase } from "db0";
import { SlipAuthCore } from "../src/runtime/core/core";
import { autoSetupTestsDatabase, createH3Event, testTablesNames } from "./test-helpers";
import { RateLimitLoginError, SlipAuthRateLimiterError } from "../src/runtime/core/errors/SlipAuthError";

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

  describe("login", () => {
    it.only("should allow 5 failed tries", async () => {
      await auth.register(createH3Event(), defaultInsert);
      const doAttempt = () => auth.login(createH3Event(), {
        email: defaultInsert.email,
        password: defaultInsert.password + "123",
      });

      const results = await Promise.all([
        doAttempt(),
        doAttempt(),
        doAttempt(),
        doAttempt(),
        doAttempt(),
      ]);

      expect(results.every(res => res instanceof SlipAuthRateLimiterError)).toBe(false);
    });

    it("should rate-limit 6 failed tries", async () => {
      await auth.register(createH3Event(), defaultInsert);
      const doAttempt = () => auth.login(createH3Event(), {
        email: defaultInsert.email,
        password: defaultInsert.password + "123",
      }).catch(e => e);

      const results = await Promise.all([
        doAttempt(),
        doAttempt(),
        doAttempt(),
        doAttempt(),
        doAttempt(),
        doAttempt(),
      ]);

      console.log(results);
      

      expect(results.every(res => res instanceof RateLimitLoginError)).toBe(false);
    });
  });
});
