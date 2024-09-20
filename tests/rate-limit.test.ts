import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import sqlite from "db0/connectors/better-sqlite3";
import { createDatabase } from "db0";
import { SlipAuthCore } from "../src/runtime/core/core";
import { slipAuthExtendWithRateLimit } from "../src/runtime/core/plugins/rate-limit";

const date = new Date(Date.UTC(1998, 11, 19));

const db = createDatabase(sqlite({
  name: "rate-limit.test",
}));

beforeEach(async () => {
  await db.sql`DROP TABLE IF EXISTS slip_oauth_accounts`;
  await db.sql`DROP TABLE IF EXISTS slip_sessions`;
  await db.sql`DROP TABLE IF EXISTS slip_users`;

  await db.sql`CREATE TABLE IF NOT EXISTS slip_users ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL UNIQUE, "email_verified" BOOLEAN DEFAULT FALSE, "password" TEXT, "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`;
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

let auth: SlipAuthCore;

describe("SlipAuthCore", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(date);
  });

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

    slipAuthExtendWithRateLimit(auth);

    auth.setCreateRandomUserId(() => {
      mocks.userCreatedCount++;
      return `user-id-${mocks.userCreatedCount}`;
    });

    auth.setCreateRandomSessionId(() => {
      mocks.sessionCreatedCount++;
      return `session-id-${mocks.sessionCreatedCount}`;
    });
  });

  describe("login with not existing user", () => {
    it("should prevent brute force", async () => {
      const validTry = auth.login(defaultInsert);
      await expect(validTry).rejects.toThrowError("InvalidEmailOrPasswordError");
      const timeoutDuration = 1000;

      const pageLoadedDateTime = new Date();
      const loginWithFirstRateLimit = auth.login(defaultInsert);

      expect(loginWithFirstRateLimit).rejects.toMatchObject({
        name: "LoginRateLimitError",
        // 1000 is the default timeout duration
        unlockedAt: new Date(pageLoadedDateTime.getTime() + timeoutDuration),
      });
    });

    it("should expand brute force protection timeout on each request", async () => {
      const attemptWithoutTimeout = auth.login(defaultInsert);
      await expect(attemptWithoutTimeout).rejects.toThrowError("InvalidEmailOrPasswordError");
      const timeoutDuration = 1000;
      const pageLoadedDateTime = new Date();

      const loginWithFirstRateLimit = auth.login(defaultInsert);

      await expect(loginWithFirstRateLimit).rejects.toMatchObject({
        name: "LoginRateLimitError",
        // 1000 is the default timeout duration
        unlockedAt: new Date(pageLoadedDateTime.getTime() + timeoutDuration),
      });

      vi.advanceTimersByTime(timeoutDuration);

      const attemptWithoutTimeou2 = auth.login(defaultInsert);
      await expect(attemptWithoutTimeou2).rejects.toThrowError("InvalidEmailOrPasswordError");

      const loginWithSecondRateLimit = auth.login(defaultInsert);
      expect(loginWithSecondRateLimit).rejects.toMatchObject({
        name: "LoginRateLimitError",
        // 1000 is the default timeout duration
        unlockedAt: new Date(pageLoadedDateTime.getTime() + timeoutDuration * 3),
      });
    });

    it("should empty rate limit timeout when user succeed to login", async () => {
      await auth.register(defaultInsert);

      const wrongPasswordLoginParams = {
        email: defaultInsert.email,
        password: "wrong password",
      };

      const attemptWithoutTimeout = auth.login(wrongPasswordLoginParams);
      await expect(attemptWithoutTimeout).rejects.toThrowError("InvalidEmailOrPasswordError");

      const loginWithFirstRateLimit = auth.login(wrongPasswordLoginParams);
      await expect(loginWithFirstRateLimit).rejects.toThrowError("LoginRateLimitError");

      const validLogin = auth.login(defaultInsert);
      await expect(validLogin).resolves.toHaveLength(2);

      const attemptWithoutTimeout2 = auth.login(wrongPasswordLoginParams);
      await expect(attemptWithoutTimeout2).rejects.toThrowError("InvalidEmailOrPasswordError");
    });
  });
});
