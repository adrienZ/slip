export default oauthGitHubEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user }) {
    const auth = useSlipAuth();

    const sessionFromDb = await auth.registerUserIfMissingInDb({
      email: user.email,
      providerId: "github",
      providerUserId: user.id,
    });

    await setUserSession(event, {
      user: {
        githubId: user.id,
      },
      expires_at: sessionFromDb.expires_at,
      id: sessionFromDb.id,
    });
    return sendRedirect(event, "/?success=true");
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error("GitHub OAuth error:", error);
    return sendRedirect(event, "/?success=false");
  },
});
