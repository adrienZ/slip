import { useSlipAuth } from "../../server/utils/useSlipAuth";
import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
  const auth = useSlipAuth();
  const session = await requireUserSession(event);
  const userId = session.user.id;

  const user = await auth.getUser({ id: userId });

  if (!user) {
    throw new Error("no user");
  }

  await auth.askEmailVerificationCode(event, { user });

  return true;
});
