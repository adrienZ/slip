export default defineEventHandler(async (event) => {
  const auth = useSlipAuth();
  const session = await requireUserSession(event);
  const userId = session.user.id;

  try {
    const user = await auth.getUser(userId);

    if (!user) {
      throw new Error("no user");
    }

    // ONLY FOR DEMO PURPOSE, UNSAFE TO USE IN PRODUCTION!
    auth.hooks.hookOnce("resetPasswordToken:create", (token) => {
      console.log(`PASSWORD TOKEN FOR EMAIL ${user.email} : ${token.token_hash}`);
    });

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
