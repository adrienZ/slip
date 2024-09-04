<!--
Get your module up and running quickly.

Find and replace all on all files (CMD+SHIFT+F):
- Name: nuxt-slip-auth
- Package name: nuxt-slip-auth
- Description: My new Nuxt module
-->

<p align="center">
  <img src="logo.webp" width="320">
</p>
<br/>

# nuxt-slip-auth 🩲
> Plug and play authentication module for Nuxt

---
[![Nuxt][nuxt-src]][nuxt-href]
[![Codecov][codecov-src]][codecov-href]
<!-- [![npm version][npm-version-src]][npm-version-href] -->
<!-- [![npm downloads][npm-downloads-src]][npm-downloads-href] -->
<!-- [![License][license-src]][license-href] -->

Slip (French word for "underwear", pronounced `/sleep/`)


- [✨ &nbsp;Release Notes](/CHANGELOG.md)
<!-- - [🏀 Online playground](https://stackblitz.com/github/adrienZ/slip?file=playground%2Fapp.vue) -->
<!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

<!-- Highlight some of the features your module provide here -->
- ⛰ &nbsp;Foo
- 🚠 &nbsp;Bar
- 🌲 &nbsp;Baz

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add nuxt-slip-auth
```

That's it! You can now use nuxt-slip-auth Module in your Nuxt app ✨

## Usage

Create a Github OAuth app (or any provider) you want: [click here](https://github.com/settings/applications/new?oauth_application[name]=My%20app&oauth_application[url]=http://localhost:3000&oauth_application[callback_url]=http://localhost:3000/)

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
```

### 3. Create your .env file
```toml[.env]
NUXT_OAUTH_GITHUB_CLIENT_ID=""
NUXT_OAUTH_GITHUB_CLIENT_SECRET=""
NUXT_SLIP_AUTH_IP_INFO_TOKEN=""
```

</details>



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
