import { useSlipAuth } from "../server/utils/useSlipAuth";
import { defineEventHandler, createError } from "h3";

export default defineEventHandler(async (event) => {
  const auth = useSlipAuth();
  const session = await requireUserSession(event);
  const userId = session.user.id;

  try {
    const user = await auth.getUser(userId);

    if (!user) {
      throw new Error("no user");
    }

    const tokenId = await auth.askPasswordReset(user.id);

    return Boolean(tokenId);
  }
  catch {
    throw createError({
      message: "Not authorized",
      statusCode: 403,
    });
  }
});
