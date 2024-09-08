<!--
Get your module up and running quickly.

Find and replace all on all files (CMD+SHIFT+F):
- Name: nuxt-slip-auth
- Package name: nuxt-slip-auth
- Description: My new Nuxt module
-->

<p align="center">
  <img src="/playground/assets/logo.webp" width="240">
</p>
<br>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]
[![Codecov][codecov-src]][codecov-href]

# nuxt-slip-auth 🩲
> Plug and play authentication module for Nuxt

- [✨ Release Notes](/CHANGELOG.md)
- [🏀 Online playground](https://codesandbox.io/p/github/adrienZ/slip/?file=%2Fplayground%2Fserver%2Froutes%2Fauth%2Fregister.post.ts)
<!-- - [📖 &nbsp;Documentation](https://example.com) -->


---

Slip (French word for "underwear", pronounced `/sleep/`) is an attempt to be the most simple way to bring authentication to your Nuxt app.

Authentication is like an underwear: you can you put it on, put it off and sometimes get stolen !

This module is build on top of [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) and [db0](https://github.com/unjs/db0) and adds the following features:

<!-- Highlight some of the features your module provide here -->
- 💾 Automatic database setup
- 🤝 100% type-safe schemas and utils
- 🗑️ Delete expired and invalidate sessions
- 🪝 Configurable and extendable with hooks
- [IpInfo](https://ipinfo.io/) integration on login

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add nuxt-slip-auth
```

Then create a Github OAuth app (or any provider) you want: [create app](https://github.com/settings/applications/new?oauth_application[name]=My%20app&oauth_application[url]=http://localhost:3000&oauth_application[callback_url]=http://localhost:3000/)

For a quick demo run the command:

```bash
npx nuxt-slip-auth demo
```
<details>
  <summary>Manuel steps</summary>

  #### 1. Install better-sqlite3

  By default, nuxt-auth-utils will use sqlite, so you'll need to run 
  ```bash
  npm install better-sqlite3
  ```

  #### 2. create an API oAuth handler


Example: `~/server/routes/auth/github.get.ts`

```ts
export default oauthGitHubEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user }) {
    const auth = useSlipAuth();

    const [userId, sessionFromDb] = await auth.OAuthLoginUser({
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
```

### 3. Create your .env file
```toml[.env]
NUXT_OAUTH_GITHUB_CLIENT_ID=""
NUXT_OAUTH_GITHUB_CLIENT_SECRET=""
NUXT_SLIP_AUTH_IP_INFO_TOKEN=""
```

</details>

Update your `.env` with your app tokens.

Example: `~/app.vue`

```vue
<script setup lang="ts">
const { loggedIn, user, session, clear } = useUserSession();
</script>

<template>
  <div v-if="loggedIn">
    <h1>Welcome {{ user.id }}!</h1>
    <p>Logged in until {{ new Date(session.expires_at).toDateString() }}</p>
    <button @click="clear">
      Logout
    </button>
  </div>
  <div v-else>
    <h1>Not logged in</h1>
    <a href="/auth/github">Login with GitHub</a>
  </div>
</template>
```
## Methods

##### `checkDbAndTables(dialect: string)`

Checks if the required database and tables are set up. Ensures that the environment is ready for authentication.

##### `OAuthLoginUser(params: ICreateOrLoginParams): Promise<[string, SlipAuthPublicSession]>`

Registers a new user in the database if they don’t already exist. It handles OAuth authentication by registering the OAuth account, creating a session, and linking the user’s details.
- **Returns**: A tuple containing the user ID and the created session details.

##### `setCreateRandomUserId(fn: () => string)`

Sets a custom method for generating random user IDs.

##### `setCreateRandomSessionId(fn: () => string)`

Sets a custom method for generating random session IDs.

##### `getSession(sessionId: string)`

Fetches a session by its session ID.

##### `deleteSession(sessionId: string)`

Deletes a session by its session ID.

##### `deleteExpiredSessions(timestamp: number)`

Deletes sessions that have expired before the provided timestamp.


## Hooks

The `hooks` property allows you to listen for and respond to events during the authentication process. The available hooks are:

- **`"users:create"`**: Triggered when a new user is created.
  - **Callback**: `(user: SlipAuthUser) => void`

- **`"oAuthAccount:create"`**: Triggered when a new OAuth account is created.
  - **Callback**: `(oAuthAccount: SlipAuthOAuthAccount) => void`

- **`"sessions:create"`**: Triggered when a new session is created.
  - **Callback**: `(session: SlipAuthSession) => void`

- **`"sessions:delete"`**: Triggered when a session is deleted.
  - **Callback**: `(session: SlipAuthSession) => void`

---

#### Properties

- `schemas`: Contains the database schemas for users, sessions, and OAuth accounts.
- `hooks`: Provides hooks to extend and configure the authentication behavior.


## Roadmap
- [x] Sqlite support
- [x] Bun-sqlite support
- [x] LibSQL support
- [ ] Postgres support
- [ ] Email + Password

## Contribution

<details>
  <summary>Local development</summary>
  
  ```bash
  # Install dependencies
  npm install
  
  # Generate type stubs
  npm run dev:prepare
  
  # Develop with the playground
  npm run dev
  
  # Build the playground
  npm run dev:build
  
  # Run ESLint
  npm run lint
  
  # Run Vitest
  npm run test
  npm run test:watch
  
  # Release new version
  npm run release
  ```

</details>


<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-slip-auth/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-slip-auth

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-slip-auth.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npmjs.com/package/nuxt-slip-auth

[license-src]: https://img.shields.io/npm/l/nuxt-slip-auth.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-slip-auth

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com

[codecov-src]:https://codecov.io/gh/adrienZ/slip/graph/badge.svg?token=GMTZW7C5S7
[codecov-href]: https://codecov.io/gh/adrienZ/slip
