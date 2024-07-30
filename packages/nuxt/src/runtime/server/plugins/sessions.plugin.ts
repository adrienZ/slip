import type { SlipAuthSession } from "@slip/core";
import { useSlipAuth } from "../utils/useSlipAuth";

export default defineNitroPlugin(() => {
  const auth = useSlipAuth();

  // @ts-expect-error sessionHooks is globally injected by nuxt-auth-utils
  const sessionHookNuxtAuth = sessionHooks;

  if (typeof sessionHookNuxtAuth !== "undefined") {
    sessionHookNuxtAuth.hook("clear", async (session: SlipAuthSession) => {
      auth.deleteSession(session.id);
    });
  }
});
