import { useSlipAuth } from "../utils/useSlipAuth";
import type { SlipAuthSession } from "../../core/types";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore yolo the DX is not great
import { defineNitroPlugin, createError, sessionHooks } from "#imports";

export default defineNitroPlugin(() => {
  const auth = useSlipAuth();

  if (typeof sessionHooks !== "undefined") {
    sessionHooks.hook("fetch", async (session: SlipAuthSession) => {
      // invalid session if not in database
      const databaseSession = await auth.getSession(session.id);
      if (!databaseSession) {
        throw createError("invalidate session");
      }
    });

    sessionHooks.hook("clear", async (session: SlipAuthSession) => {
      auth.deleteSession(session.id);
    });
  }
});
