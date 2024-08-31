import { useSlipAuth } from "../utils/useSlipAuth";
import type { SlipAuthSession } from "../../core/core";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore yolo the DX is not great
import { defineNitroPlugin, sessionHooks } from "#imports";

export default defineNitroPlugin(() => {
  const auth = useSlipAuth();

  if (typeof sessionHooks !== "undefined") {
    sessionHooks.hook("clear", async (session: SlipAuthSession) => {
      auth.deleteSession(session.id);
    });
  }
});
