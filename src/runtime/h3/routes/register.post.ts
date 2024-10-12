import { useSlipAuth } from "../../server/utils/useSlipAuth";
import { defineEventHandler, readBody, getHeader } from "h3";

// TODO: prevent register when user is already logged
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const auth = useSlipAuth();

  const [userId, session] = await auth.register(event, {
    ...body,
    ua: getHeader(event, "User-Agent"),
  });

  const user = await auth.getUser({ id: userId });

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
});
