import { useSlipAuth } from "../../server/utils/useSlipAuth";
import { defineEventHandler, readBody } from "h3";

export default defineEventHandler(async (event) => {
  const auth = useSlipAuth();
  const session = await requireUserSession(event);
  const userId = session.user.id;
  const body = await readBody(event);

  const user = await auth.getUser({ id: userId });

  if (!user) {
    throw new Error("no user");
  }

  const validation = await auth.verifyEmailVerificationCode(event, { user, code: body.code });

  // update user session
  await setUserSession(event, {
    user: {
      id: user.id,
      // update user session value
      email_verified: validation,
    },
    id: session.id,
    expires_at: session.expires_at,
  });
  return validation;
});
