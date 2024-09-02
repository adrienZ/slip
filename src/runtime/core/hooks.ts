import { createHooks } from "hookable";
import type { SlipAuthSession, SlipAuthUser } from "./types";

export interface ISlipAuthHooks {
  /**
   * aka register
   */
  "users:create": (user: SlipAuthUser) => void
  /**
   * aka login
   */
  "sessions:create": (session: SlipAuthSession) => void
  /**
   * aka logout or expiration
   */
  // TODO: add tests
  "sessions:delete": (session: SlipAuthSession) => void
}

export function createSlipHooks() {
  return createHooks<ISlipAuthHooks>();
}
