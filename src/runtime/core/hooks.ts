import { createHooks, type Hookable, type HookKeys } from "hookable";
import type { SlipAuthSession, SlipAuthUser, SlipAuthOAuthAccount, SlipAuthEmailVerificationCode, EmailVerificationCodeTableInsert } from "./types";

interface ISlipAuthHooksMap {
  // users
  "users:create": (user: SlipAuthUser) => void
  // oAuthAccounts
  "oAuthAccount:create": (oAuthAccount: SlipAuthOAuthAccount) => void
  // sessions
  "sessions:create": (session: SlipAuthSession) => void
  "sessions:delete": (session: SlipAuthSession) => void
  // emailVerificationCode
  "emailVerificationCode:create": (emailVerificationCodeValues: EmailVerificationCodeTableInsert) => void
  "emailVerificationCode:delete": (emailVerificationCode: SlipAuthEmailVerificationCode) => void
}

export type ISlipAuthHooks = Hookable<ISlipAuthHooksMap, HookKeys<ISlipAuthHooksMap>>;

export function createSlipHooks(): ISlipAuthHooks {
  return createHooks<ISlipAuthHooksMap>();
}
