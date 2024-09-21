import type { SlipAuthCore } from "../core";
import { createStorage, type Storage } from "unstorage";
import memoryDriver from "unstorage/drivers/memory";
import { LoginRateLimitError } from "../errors/SlipAuthError";
import { getCookie, setCookie } from "h3";
import { alphabet, generateRandomString } from "oslo/crypto";

interface IStorageRateLimitShape {
  // timestamp
  timeoutUntil: number
  timeoutMilliSeconds: number
}
interface IStorageDeviceIdShape {
  email: string
  attempts: number
}

interface ISlipAuthCoreLoginThrottleConfig {
  rateLimitStorage: Storage<IStorageRateLimitShape>
  deviceIdStorage: Storage<IStorageDeviceIdShape>
}

async function isValidateDeviceCookie(
  storage: ISlipAuthCoreLoginThrottleConfig["deviceIdStorage"],
  deviceCookieId: string | null,
  email: string,
) {
  if (!deviceCookieId) return false;
  const deviceCookieAttributes = await storage.getItem(deviceCookieId) ?? null;
  if (!deviceCookieAttributes) return false;
  const currentAttempts = deviceCookieAttributes.attempts + 1;
  if (currentAttempts > 5 || deviceCookieAttributes.email !== email) {
    await storage.removeItem(deviceCookieId);
    return false;
  }

  await storage.setItem(deviceCookieId, {
    email,
    attempts: currentAttempts,
  });
  // TODO REMOVE THOSE LOGS
  console.log({ currentAttempts });
  console.log("VALID COOKIE", deviceCookieId, await storage.getItem(deviceCookieId));
  return true;
};

const generateDeviceId = () => generateRandomString(40, alphabet("a-z", "A-Z", "0-9"));

// https://v2.lucia-auth.com/guidebook/login-throttling/
export function slipAuthExtendWithRateLimit(auth: SlipAuthCore, config?: Partial<ISlipAuthCoreLoginThrottleConfig>) {
  const rateLimitStorage = config?.rateLimitStorage ?? createStorage<IStorageRateLimitShape>({
    driver: memoryDriver(),
  });

  const deviceIdStorage = config?.deviceIdStorage ?? createStorage<IStorageDeviceIdShape>({
    driver: memoryDriver(),
  });

  const DEVICE_COOKIE_NAME = "slip_device_cookie";

  auth.hooks.hook("login:password-failed", async (email, h3event) => {
    if (!h3event) {
      return;
    }

    const storedDeviceCookieId = getCookie(h3event, DEVICE_COOKIE_NAME) ?? null;
    const validDeviceCookie = await isValidateDeviceCookie(
      deviceIdStorage,
      storedDeviceCookieId,
      email,
    );

    if (!validDeviceCookie) {
      // delete invalid cookie
      setCookie(h3event, DEVICE_COOKIE_NAME, "", {
        path: "/",
        secure: !import.meta.dev, // true for production
        maxAge: 0,
        httpOnly: true,
      });

      const storedTimeout = await rateLimitStorage.getItem(email);
      const timeoutUntil = storedTimeout?.timeoutUntil ?? 50;

      if (Date.now() < timeoutUntil) {
        // 429 too many requests
        const unlockedAt = storedTimeout?.timeoutUntil ? new Date(storedTimeout.timeoutUntil) : undefined;
        throw new LoginRateLimitError(unlockedAt);
      }

      // increase timeout
      const timeoutMilliSeconds = storedTimeout ? storedTimeout.timeoutMilliSeconds * 2 : 1000;
      await rateLimitStorage.setItem(email, {
        timeoutUntil: Date.now() + timeoutMilliSeconds,
        timeoutMilliSeconds,
      });
    }

    const newDeviceCookieId = generateDeviceId();
    await deviceIdStorage.setItem(newDeviceCookieId, {
      email,
      attempts: 0,
    });
    setCookie(h3event, DEVICE_COOKIE_NAME, newDeviceCookieId, {
      path: "/",
      secure: !import.meta.dev, // true for production
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
    });
  });

  auth.hooks.hook("sessions:create", async (session) => {
    const userLoggedWithSuccess = await auth.getUser(session.user_id);
    if (userLoggedWithSuccess) {
      await rateLimitStorage.removeItem(userLoggedWithSuccess.email);
    }
  });
}
