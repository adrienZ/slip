import { createHooks, type Hookable, type HookKeys } from "hookable";
import type { SlipAuthSession, SlipAuthUser, SlipAuthOAuthAccount } from "./types";
import type { H3Event } from "h3";

interface ISlipAuthHooksMap {
  // users
  "users:create": (user: SlipAuthUser) => void
  // oAuthAccounts
  "oAuthAccount:create": (oAuthAccount: SlipAuthOAuthAccount) => void
  // sessions
  "sessions:create": (session: SlipAuthSession) => void
  "sessions:delete": (session: SlipAuthSession) => void
  // login
  "login:password-failed": (email: string, event?: H3Event) => void
}

export type ISlipAuthHooks = Hookable<ISlipAuthHooksMap, HookKeys<ISlipAuthHooksMap>>;

export function createSlipHooks(): ISlipAuthHooks {
  return createHooks<ISlipAuthHooksMap>();
}
