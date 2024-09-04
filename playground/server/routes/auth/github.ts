export default oauthGitHubEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user }) {
    const auth = useSlipAuth();

    const [userId, sessionFromDb] = await auth.registerUserIfMissingInDb({
      email: user.email,
      providerId: "github",
      providerUserId: user.id,
      ua: getRequestHeader(event, "User-Agent"),
      ip: getRequestIP(event),
    });

    await setUserSession(event, {
      expires_at: sessionFromDb.expires_at,
      id: sessionFromDb.id,
      user: {
        id: userId,
      },
    });
    return sendRedirect(event, "/");
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error("GitHub OAuth error:", error);
    return sendRedirect(event, "/");
  },
});
