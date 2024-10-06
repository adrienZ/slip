import { beforeEach, describe, expect, it, vi } from "vitest";
import { Throttler } from "../src/runtime/core/rate-limit/Throttler";
import { SlipAuthRateLimiterError } from "../src/runtime/core/errors/SlipAuthError";
import { RateLimiterRes } from "rate-limiter-flexible";
import { createStorage } from "unstorage";
import memoryDriver from "unstorage/drivers/memory";

const date = new Date(Date.UTC(1998, 11, 19));

const storage = createStorage<number>({
  driver: memoryDriver(),
});

describe("Throttler", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("should allow X failed attemps", async () => {
    const attempsLimit = 5;

    const rateLimit = new Throttler({
      points: attempsLimit,
      duration: 20,
    },
    {
      storage,
    });

    const attemptsArray = Array.from(Array(attempsLimit).keys());
    const attemptsResults = await Promise.all(attemptsArray.map(async () => {
      return await rateLimit.consumeIncremental("hey");
    }));

    expect(attemptsResults.every(_result => _result instanceof RateLimiterRes)).toBe(true);
  });

  it("should not allow X + 1 failed attemps", async () => {
    const attempsLimit = 5;

    const rateLimit = new Throttler({
      points: attempsLimit,
      duration: 20,
    },
    {
      storage,
    });

    const attemptsArray = Array.from(Array(attempsLimit + 1).keys());
    const attemptsResults = await Promise.all(attemptsArray.map(async () => {
      return await rateLimit.consumeIncremental("hey");
    }));

    const allAttemptsButLast = attemptsResults.slice(0, -1);
    const lastAttempt = attemptsResults[attemptsResults.length - 1];

    expect(allAttemptsButLast.every(_result => _result instanceof RateLimiterRes)).toBe(true);
    expect(lastAttempt instanceof SlipAuthRateLimiterError).toBe(true);
    expect((lastAttempt as SlipAuthRateLimiterError).data.msBeforeNext).toBe(5000);
  });

  it("should increment timeout on failed attemps", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(date);

    const attempsLimit = 5;

    const rateLimit = new Throttler({
      points: attempsLimit,
      duration: 20,
    },
    {
      storage,
      initialBlockDurationSeconds: 1,
    });

    const attemptsArray = Array.from(Array(attempsLimit).keys());
    await Promise.all(attemptsArray.map(async () => {
      return await rateLimit.consumeIncremental("hey");
    }));

    // Now, exceed the limit and verify block duration increments correctly
    let expectedMsBeforeNext = 1000; // Initial block duration in ms (1 second)
    for (let i = 0; i < 20; i++) {
      // vi.advanceTimersByTime(expectedMsBeforeNext);
      const result = await rateLimit.consumeIncremental("hey") as SlipAuthRateLimiterError;

      // Expect SlipAuthRateLimiterError after limit is reached
      expect(result instanceof SlipAuthRateLimiterError).toBe(true);
      expect(result.data.msBeforeNext).toBe(
        expectedMsBeforeNext,
      );

      // Double the expected block duration for the next iteration
      expectedMsBeforeNext = Math.min(expectedMsBeforeNext * 2, Number.MAX_SAFE_INTEGER);
    }
  });
});
