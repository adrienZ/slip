export default defineEventHandler(async (event) => {
  const auth = useSlipAuth();
  const { id } = await requireUserSession(event);

  const session = await auth.getSession({ sessionId: id });

  return session;
});
