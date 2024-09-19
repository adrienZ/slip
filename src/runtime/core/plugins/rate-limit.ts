import type { SlipAuthCore } from "../core";
import { createStorage, type Storage } from "unstorage";
import memoryDriver from "unstorage/drivers/memory";
import { LoginRateLimitError } from "../errors/SlipAuthError";

interface IStorageRateLimitShape {
  // timestamp
  timeoutUntil: number
  timeoutMilliSeconds: number
}

interface ISlipAuthCoreLoginThrottleConfig {
  storage: Storage<IStorageRateLimitShape>
}

// https://v2.lucia-auth.com/guidebook/login-throttling/
export function slipAuthExtendWithRateLimit(auth: SlipAuthCore, config?: Partial<ISlipAuthCoreLoginThrottleConfig>) {
  const storage = config?.storage ?? createStorage<IStorageRateLimitShape>({
    driver: memoryDriver(),
  });

  auth.hooks.hook("login:password-failed", async (email) => {
    const storedTimeout = await storage.getItem(email);
    const timeoutUntil = storedTimeout?.timeoutUntil ?? 50;

    if (Date.now() < timeoutUntil) {
      // 429 too many requests
      const unlockedAt = storedTimeout?.timeoutUntil ? new Date(storedTimeout.timeoutUntil) : undefined;
      throw new LoginRateLimitError(unlockedAt);
    }

    // increase timeout
    const timeoutMilliSeconds = storedTimeout ? storedTimeout.timeoutMilliSeconds * 2 : 1000;
    await storage.setItem(email, {
      timeoutUntil: Date.now() + timeoutMilliSeconds,
      timeoutMilliSeconds,
    });
  });

  auth.hooks.hook("sessions:create", async (session) => {
    const userLoggedWithSuccess = await auth.getUser(session.user_id);
    if (userLoggedWithSuccess) {
      storage.removeItem(userLoggedWithSuccess.email);
    }
  });
}
