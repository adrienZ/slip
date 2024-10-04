import { SlipAuthError } from "../../core/errors/SlipAuthError";
import { useSlipAuth } from "../../server/utils/useSlipAuth";
import { defineEventHandler, createError } from "h3";

export default defineEventHandler(async (event) => {
  const auth = useSlipAuth();
  const session = await requireUserSession(event);
  const userId = session.user.id;

  try {
    const user = await auth.getUser({ userId });

    if (!user) {
      throw new Error("no user");
    }

    await auth.askEmailVerificationCode(event, { user });

    return true;
  }
  catch (error) {
    throw createError({
      ...(error instanceof Error ? error : {}),
      data: error instanceof SlipAuthError ? error : undefined,
    });
  }
});
