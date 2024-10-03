export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const auth = useSlipAuth();

  const [userId, session] = await auth.login({
    ...body,
    ua: getHeader(event, "User-Agent"),
  });
  const user = await auth.getUser(userId);

  await setUserSession(event, {
    expires_at: session.expires_at,
    id: session.id,
    user: {
      id: userId,
      email_verified: user?.email_verified ?? false,
    },
  });
  return sendRedirect(event, "/");
});
