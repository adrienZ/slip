export default defineEventHandler(async (event) => {
  const auth = useSlipAuth();
  const session = await requireUserSession(event);
  const userId = session.user.id;
  const body = await readFormData(event);

  try {
    const user = await auth.getUser(userId);

    if (!user) {
      throw new Error("no user");
    }

    // ONLY FOR DEMO PURPOSE, UNSAFE TO USE IN PRODUCTION!
    auth.hooks.hookOnce("emailVerificationCode:delete", (code) => {
      console.log(`VERIFICATION VALIDATED FOR EMAIL ${user.email} with code ${code.code}`);
    });

    const validation = await auth.verifyEmailVerificationCode(user, body.get("code")?.toString() ?? "");

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
  }
  catch {
    throw createError({
      message: "Not authorized",
      statusCode: 403,
    });
  }
});
