import { useSlipAuth } from "../utils/useSlipAuth";
import type { SlipAuthPublicSession } from "../../types";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore yolo the DX is not great
import { defineNitroPlugin, createError, sessionHooks, hashPassword, verifyPassword } from "#imports";

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
    sessionHooks.hook("fetch", async (session: SlipAuthPublicSession) => {
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
