import { createHooks, type Hookable, type HookKeys } from "hookable";
import type { SlipAuthSession, SlipAuthUser, SlipAuthOAuthAccount } from "./types";

interface ISlipAuthHooksMap {
  "users:create": (user: SlipAuthUser) => void
  "sessions:create": (session: SlipAuthSession) => void
  // TODO: add tests
  "oAuthAccount:create": (oAuthAccount: SlipAuthOAuthAccount) => void
  // TODO: add tests
  "sessions:delete": (session: SlipAuthSession) => void
}

export type ISlipAuthHooks = Hookable<ISlipAuthHooksMap, HookKeys<ISlipAuthHooksMap>>;

export function createSlipHooks(): ISlipAuthHooks {
  return createHooks<ISlipAuthHooksMap>();
}
