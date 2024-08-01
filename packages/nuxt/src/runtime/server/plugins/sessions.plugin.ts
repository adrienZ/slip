import type { SlipAuthSession } from "slip-auth-core";
import { useSlipAuth } from "../utils/useSlipAuth";
// @ts-expect-error sessionHooks is globally injected by nuxt-auth-utils
import { defineNitroPlugin, sessionHooks } from "#imports";

export default defineNitroPlugin(() => {
  const auth = useSlipAuth();

  const sessionHookNuxtAuth = sessionHooks;

  if (typeof sessionHookNuxtAuth !== "undefined") {
    sessionHookNuxtAuth.hook("clear", async (session: SlipAuthSession) => {
      auth.deleteSession(session.id);
    });
  }
});
