import { drizzle as drizzleIntegration } from "db0/integrations/drizzle/index";

export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user }) {
    const auth = useSlipAuth();
    const db = drizzleIntegration(useDatabase());

    const [userId, sessionFromDb] = await auth.OAuthLoginUser({
      email: user.email,
      providerId: "github",
      providerUserId: user.id,
      ua: getRequestHeader(event, "User-Agent"),
      ip: getRequestIP(event),
    });

    const userDb = await db
      .select()
      .from(auth.schemas.users)
      .get();

    await setUserSession(event, {
      expires_at: sessionFromDb.expires_at,
      id: sessionFromDb.id,
      user: {
        id: userId,
        email_verified: userDb?.email_verified || false,
      },
    });
    return sendRedirect(event, "/profile");
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error("GitHub OAuth error:", error);
    return sendRedirect(event, "/?authError=" + error);
  },
});
