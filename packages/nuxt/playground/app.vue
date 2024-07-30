<script setup>
const { loggedIn, user, session, clear } = useUserSession()

const {data: usersInDb} = await useAsyncData("usersInDb", () => $fetch("/api/users"))
</script>

<template>
  <div v-if="loggedIn">
    <h1>Welcome {{ user.login }}!</h1>
    <p>Logged in until {{ new Date(session.expires_at).toDateString() }}</p>
    <button @click="clear">Logout</button>
  </div>
  <div v-else>
    <h1>Not logged in</h1>
    <a href="/auth/github">Login with GitHub</a>
  </div>

  <pre>{{ JSON.stringify(usersInDb, null, 2) }}</pre>
</template>