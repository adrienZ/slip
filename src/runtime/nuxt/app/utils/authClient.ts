import type { SlipAuthCore } from "../../../core/core";
import { routerRecord } from "../../../h3/routerRecord";
import { ofetch } from "ofetch";
import { useRequestURL } from "#imports";

import type loginHandler from "../../../h3/routes/login.post";
import type registerHandler from "../../../h3/routes/register.post";
import type askEmailVerificationCodeHandler from "../../../h3/routes/ask-email-verification.post";
import type verifyEmailVerificationCodeHandler from "../../../h3/routes/verify-email-verification.post";

export function getSlipAuthClient() {
  const httpClient = ofetch.create({
    baseURL: useRequestURL().origin,
  });

  return {
    login: (body: Parameters<SlipAuthCore["login"]>[0]) => httpClient(routerRecord.login, {
      method: "POST",
      body,
    }) as ReturnType<typeof loginHandler>,
    register: (body: Parameters<SlipAuthCore["register"]>[0]) => httpClient(routerRecord.register, {
      method: "POST",
      body,
    }) as ReturnType<typeof registerHandler>,
    askEmailVerificationCode: () => httpClient(routerRecord.askEmailVerificationCode, {
      method: "POST",
    }) as ReturnType<typeof askEmailVerificationCodeHandler>,
    verifyEmailVerificationCode: (body: { code: string }) => httpClient(routerRecord.verifyEmailVerificationCode, {
      method: "POST",
      body,
    }) as ReturnType<typeof verifyEmailVerificationCodeHandler>,
  };
};
