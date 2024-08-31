import { useSlipAuth } from "../utils/useSlipAuth";
import type { SlipAuthSession } from "../../core/core";
// @ts-expect-error yolo the DX is not great
import { defineNitroPlugin, sessionHooks } from "#imports";

export default defineNitroPlugin(() => {
  const auth = useSlipAuth();

  if (typeof sessionHooks !== "undefined") {
    // @ts-expect-error for now leave me alone
    sessionHooks.hook("clear", async (session: SlipAuthSession) => {
      auth.deleteSession(session.id);
    });
  }
});
