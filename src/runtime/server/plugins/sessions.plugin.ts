import { useSlipAuth } from "../utils/useSlipAuth";
import type { SlipAuthSession } from "@/src/core/src/core";

// @ts-expect-error TODO: typecheck is failing here for no reason
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
