import type { SlipAuthCore } from "../core/core";

export const routerBase = "/_slip";

type authExposedMethods = keyof Pick<SlipAuthCore, "register" | "login" | "askEmailVerificationCode" | "verifyEmailVerificationCode">;

export const routerRecord: Record<authExposedMethods, string> = {
  login: `${routerBase}/login`,
  register: `${routerBase}/register`,
  askEmailVerificationCode: `${routerBase}/ask-email-verification-code`,
  verifyEmailVerificationCode: `${routerBase}/verify-email-verification-code`,
};
