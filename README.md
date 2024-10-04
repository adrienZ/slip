<!--
Get your module up and running quickly.

Find and replace all on all files (CMD+SHIFT+F):
- Name: nuxt-slip-auth
- Package name: nuxt-slip-auth
- Description: My new Nuxt module
-->

<p align="center">
  <img src="/playground/public/logo.webp" width="240">
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

> [!IMPORTANT]
> nuxt-slip-auth development is in the early stages.

---

Slip (French word for "underwear", pronounced `/sleep/`) is an attempt to be the most simple way to bring authentication to your Nuxt app.

Authentication is like an underwear: you can you put it on, put it off and sometimes get stolen !

This module is build on top of [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) and [db0](https://github.com/unjs/db0) and adds the following features:

<!-- Highlight some of the features your module provide here -->
- 💾 Automatic database setup + migrations
- 🤝 100% type-safe schemas and utils
- 🗑️ Delete expired and invalidate sessions
- 💌 Email + password (+ email verification code)
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
const { loggedIn, user, session, clear, fetch: fetchSession } = useUserSession();

const authClient = getSlipAuthClient();
async function seedUser() {
  const email = `user-${Math.random()}@email.com`;
  const password = "password";

  await authClient.register({
    email,
    password,
  });

  await fetchSession();
}
</script>

<template>
  <div v-if="loggedIn && user">
    <h1>Welcome {{ user.id }}!</h1>
    <p>Logged in until {{ new Date(session.expires_at).toDateString() }}</p>
    <button @click="clear">
      Logout
    </button>
  </div>
  <div v-else>
    <h1>Not logged in</h1>
    <button @click="seedUser">Create email + password user</button>
    <a href="/auth/github">Login with GitHub</a>
  </div>
</template>
```
## Methods

##### `checkDbAndTables(dialect: string)`

Checks if the required database and tables are set up. Ensures that the environment is ready for authentication.

##### `register(values: ICreateUserParams): Promise<[ string, SlipAuthPublicSession]>`

Registers a new user in the database if they don’t already exist, email + password.

##### `login(values: ILoginUserParams): Promise<[ string, SlipAuthPublicSession]>`

##### `askEmailVerificationCode(user: SlipAuthUser): Promise<void>`

Ask the email verification code for a user.
##### `verifyEmailVerificationCode(user: SlipAuthUser, code: string): Promise<boolean>`

Checks the email verification code. Returns a boolean.
Don't forget to re-login after verifying the email verification code.

##### `OAuthLoginUser(params: ICreateOrLoginParams): Promise<[string, SlipAuthPublicSession]>`

Registers a new user in the database if they don’t already exist. It handles OAuth authentication by registering the OAuth account, creating a session, and linking the user’s details.
- **Returns**: A tuple containing the user ID and the created session details.

##### `getUser(userId: string)`

Fetches a user by its user ID.

##### `getSession(sessionId: string)`

Fetches a session by its session ID.

##### `deleteSession(sessionId: string)`

Deletes a session by its session ID.

##### `deleteExpiredSessions(timestamp: number)`

Deletes sessions that have expired before the provided timestamp.

#### `askPasswordReset(userId: string)`

creates a reset password token for a specified user

#### `askForgotPasswordReset(email: string)`

Same as `askPasswordReset` but with email instead of userId.

#### resetPasswordWithResetToken

Resets the password using the reset token.


## Hooks

The hooks property allows you to listen for and respond to events during the authentication process. The available hooks are:

| Hook Name                | Description                                  | Callback                                    |
|-------------------------|----------------------------------------------|---------------------------------------------|
| **"users:create"**      | Triggered when a new user is created.       | (user: SlipAuthUser) => void                |
| **"emailVerificationCode:create"**      | Triggered when a new user is created.       | (code: EmailVerificationCodeTableInsert) => void                |
| **"oAuthAccount:create"**| Triggered when a new OAuth account is created.| (oAuthAccount: SlipAuthOAuthAccount) => void |
| **"sessions:create"**   | Triggered when a new session is created.    | (session: SlipAuthSession) => void          |
| **"sessions:delete"**   | Triggered when a session is deleted.        | (session: SlipAuthSession) => void          |
| **"emailVerificationCode:delete"**   | Triggered when a user email is validated.        | (code: SlipAuthEmailVerificationCode) => void          |
| **"resetPasswordToken:create"**   | Triggered when a user passsword reset is asked.        | (token: SlipAuthPasswordResetToken) => void          |
| **"resetPasswordToken:delete"**   | Triggered when a user passsword reset is validated or expired.        | (token: SlipAuthPasswordResetToken) => void          |

---

#### Properties

- `schemas`: Contains the database schemas for users, sessions, and OAuth accounts.
- `hooks`: Provides hooks to extend and configure the authentication behavior.

## Setters

under auth.setters

##### `setCreateRandomUserId(fn: () => string)`

Sets a custom method for generating random user IDs.

##### `setCreateRandomSessionId(fn: () => string)`

Sets a custom method for generating random session IDs.

##### `setCreateRandomEmailVerificationCode(fn: () => string)`

Sets a custom method for generating random email verification codes.

##### `setPasswordHashingMethods(fn: () => IPasswordHashingMethods)`

Sets custom methods for hashing and verifying passwords.

##### `setCreateResetPasswordTokenHashMethod(fn: (tokenId: string) => Promise<string>)`

Sets custom method for reset password token hashing.

## Database migraions

By default, nuxt-slip-auth will create tables in your database for you !

However, if you want to use exising table you can still use [`drizze-kit`](https://orm.drizzle.team/kit-docs/overview) to generate and run migrations

create a server/schema.ts file

```ts[server/schemas.ts]
import { getNuxtSlipAuthSchemas } from "nuxt-slip-auth/nuxt-drizzle";

// getNuxtSlipAuthSchemas accepts a tableNames argument where you can provide your table names
export const {
  users,
  emailVerificationCodes,
  oauthAccounts,
  resetPasswordTokens,
  sessions,
} = getNuxtSlipAuthSchemas();
```

then create a drizzle.config.ts file

```ts[drizzle.config.ts]
import { defineConfig } from "drizzle-kit";
import path from "node:path";

function getDbUrl() {
  return path.resolve(__dirname, ".data/db.sqlite3");
}

export default defineConfig({
  dialect: "sqlite",
  out: "./migrations",
  schema: "./server/schemas.ts",
  dbCredentials: {
    url: getDbUrl(),
  },
});
```

run

```bash
npx drizzle-kit generate
```

You should have your migrations in the migrations folder.

## Roadmap
- [x] Sqlite support
- [x] Bun-sqlite support
- [x] LibSQL support
- [ ] PGlite support
- [ ] Postgres support
- [x] Email + Password
  - [x] forgot password
  - [x] reset password
  - [ ] rate-limit login
  - [ ] rate-limit email verification
  - [ ] rate-limit forgot password
  - [ ] rate-limit reset password
  - [ ] rate limit register
- [ ] error message strategy (email already taken, etc)
- [ ] oauth accounts linking
- [ ] ~~Ihavebeenpwnd plugin~~
- [ ] handle sub-adressing (register spam)
- [ ] MFA plugin
- [ ] CSRF plugin
- [ ] organization plugin
- [ ] magick link plugin
- [ ] passkey link plugin
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
