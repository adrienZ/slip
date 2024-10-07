import { createStorage, type Storage } from "unstorage";
import memoryDriver from "unstorage/drivers/memory";

export function createThrottlerStorage(): Storage<ThrottlingCounter> {
  return createStorage<ThrottlingCounter>({
    driver: memoryDriver(),
  });
}

/**
 * @see https://github.com/pilcrowOnPaper/astro-email-password-2fa/blob/main/src/lib/server/rate-limit.ts
 *
 * added suport for unstorage
 */
export class Throttler {
  public timeoutSeconds: number[];

  public storage: Storage<ThrottlingCounter>;

  constructor({ timeoutSeconds, storage }: { timeoutSeconds: number[], storage: Storage }) {
    this.timeoutSeconds = timeoutSeconds;
    this.storage = storage;
  }

  public async check(key: string): Promise<
      [true] | [false, ThrottlingCounter]
  > {
    const counter = await this.storage.getItem(key) ?? null;
    const now = Date.now();
    if (counter === null) {
      return [true];
    }

    const valid = now - counter.updatedAt >= this.timeoutSeconds[counter.timeout] * 1000;

    if (valid) {
      return [true];
    }
    else {
      return [false, { updatedAt: counter.updatedAt, timeout: this.timeoutSeconds[counter.timeout] }];
    }
  }

  public async increment(key: string): Promise<void> {
    let counter = await this.storage.getItem(key) ?? null;

    const now = Date.now();
    if (counter === null) {
      counter = {
        timeout: 0,
        updatedAt: now,
      };
      await this.storage.setItem(key, counter);
      return;
    }
    counter.updatedAt = now;
    counter.timeout = Math.min(counter.timeout + 1, this.timeoutSeconds.length - 1);
    await this.storage.setItem(key, counter);
  }

  public async reset(key: string): Promise<void> {
    await this.storage.removeItem(key);
  }
}

interface ThrottlingCounter {
  timeout: number
  updatedAt: number
}
