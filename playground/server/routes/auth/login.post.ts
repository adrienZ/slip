export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const auth = useSlipAuth();

  const [userId, session] = await auth.login({
    ...body,
    ua: getHeader(event, "User-Agent"),
  });

  await setUserSession(event, {
    expires_at: session.expires_at,
    id: session.id,
    user: {
      id: userId,
    },
  });
  return sendRedirect(event, "/");
});
