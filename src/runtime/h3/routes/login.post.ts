import { SlipAuthError } from "../../core/errors/SlipAuthError";
import { useSlipAuth } from "../../server/utils/useSlipAuth";
import { defineEventHandler, readBody, getHeader } from "h3";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const auth = useSlipAuth();

  try {
    const [userId, session] = await auth.login({
      ...body,
      ua: getHeader(event, "User-Agent"),
    });
    const user = await auth.getUser(userId);

    if (!user) {
      return false;
    }

    await setUserSession(event, {
      expires_at: session.expires_at,
      id: session.id,
      user: {
        id: userId,
        email_verified: user?.email_verified ?? false,
      },
    });

    return true;
  }
  catch (error) {
    throw createError({
      ...(error instanceof Error ? error : {}),
      data: error instanceof SlipAuthError ? error : undefined,
    });
  }
});