import { useSlipAuth } from "../utils/useSlipAuth";
import type { SlipAuthPublicSession } from "../../types";
import { useSession, type H3Event } from "h3";
import { defu } from "defu";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore yolo the DX is not great
import { defineNitroPlugin, createError, sessionHooks, hashPassword, verifyPassword, useRuntimeConfig } from "#imports";

async function getRawSlipSession(event: H3Event): Promise<SlipAuthPublicSession> {
  const runtimeConfig = useRuntimeConfig(event);
  const envSessionPassword = `${runtimeConfig.nitro?.envPrefix || "NUXT_"}SESSION_PASSWORD`;
  const sessionConfig = defu({ password: process.env[envSessionPassword] }, runtimeConfig.session);
  const session = await useSession(event, sessionConfig);

  return session.data as SlipAuthPublicSession;
}

export default defineNitroPlugin(() => {
  const auth = useSlipAuth();

  if (typeof hashPassword !== "undefined" && typeof verifyPassword !== "undefined") {
    auth.setters.setPasswordHashingMethods(() => {
      return {
        hash: hashPassword,
        verify: verifyPassword,
      };
    });
  }

  if (typeof sessionHooks !== "undefined") {
    sessionHooks.hook("fetch", async (_session: UserSession, event: H3Event) => {
      const session = await getRawSlipSession(event);

      if (!session.id) {
        throw createError("invalidate session");
      }

      // invalid session if not in database
      const databaseSession = await auth.getSession({ id: session.id });
      if (!databaseSession) {
        throw createError("invalidate session");
      }
    });

    sessionHooks.hook("clear", async (session: SlipAuthPublicSession) => {
      auth.deleteSession({ id: session.id });
    });
  }
});
