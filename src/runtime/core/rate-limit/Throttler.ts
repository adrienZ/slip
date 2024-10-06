import { RateLimiterMemory, RateLimiterRes, type IRateLimiterOptions } from "rate-limiter-flexible";
import { createStorage, type Storage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import { SlipAuthRateLimiterError } from "../errors/SlipAuthError";

export function createThrottlerStorage(base: string = "./.data/cache/ratelimit"): Storage<number> {
  return createStorage<number>({
    driver: fsDriver({ base }),
  });
}

export class Throttler extends RateLimiterMemory {
  storage: Storage<number>;
  initialBlockDurationSeconds = 5;
  #incrementFactor = 2;

  constructor(depOptions: IRateLimiterOptions, options: { storage: Storage<number>, initialBlockDurationSeconds?: number }) {
    super(depOptions);
    this.storage = options.storage;
    this.initialBlockDurationSeconds = options.initialBlockDurationSeconds ?? this.initialBlockDurationSeconds;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async consumeIncremental(key: string | number, pointsToConsume?: number, options?: { [key: string]: any }): Promise<RateLimiterRes | SlipAuthRateLimiterError> {
    const strKey = key.toString();
    const cachedBlockDuration = await this.storage.getItem(strKey) ?? (this.initialBlockDurationSeconds / this.#incrementFactor);

    return super.consume(strKey, pointsToConsume, options)
      .then((res) => {
        this.storage.setItem(strKey, cachedBlockDuration);

        if (res.remainingPoints <= 0) {
          this.block(strKey, cachedBlockDuration);
        }

        return res;
      })
      .catch((error) => {
        let msBeforeNext;

        if (error instanceof RateLimiterRes && error.remainingPoints === 0) {
          // Increase block duration and ensure it stays within the 32-bit signed integer range
          const newBlockDuration = Math.min(cachedBlockDuration * 2, Number.MAX_SAFE_INTEGER);
          this.storage.setItem(strKey, newBlockDuration);
          msBeforeNext = newBlockDuration * 1000;
        }

        return new SlipAuthRateLimiterError({
          msBeforeNext: msBeforeNext,
        });
      });
  }
}
