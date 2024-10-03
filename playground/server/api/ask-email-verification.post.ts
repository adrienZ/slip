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
    auth.hooks.hookOnce("emailVerificationCode:create", (code) => {
      console.log(`VERIFICATION CODE FOR EMAIL ${user.email} : ${code.code}`);
    });

    await auth.askEmailVerificationCode(user);

    return true;
  }
  catch {
    throw createError({
      message: "Not authorized",
      statusCode: 403,
    });
  }
});
