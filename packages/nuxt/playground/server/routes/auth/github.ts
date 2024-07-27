export default oauth.githubEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user, tokens }) {
    const auth = useSlipAuth();

    auth.registerUser(user.id, user.email)

    await setUserSession(event, {
      user: {
        githubId: user.id
      },
      loggedInAt: Date.now(),
    })
    return sendRedirect(event, '/?success=true')
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/?success=false')
  },
})