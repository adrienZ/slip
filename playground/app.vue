<script setup>
const { loggedIn, user, session, clear } = useUserSession();

const { data: usersInDb } = await useAsyncData("usersInDb", () => $fetch("/api/users"));
</script>

<template>
  <UAlert title="Heads up!" />

  <div v-if="loggedIn">
    <h1>Welcome {{ user.id }}!</h1>
    <p>Logged in until {{ new Date(session.expires_at).toDateString() }}</p>
    <button @click="clear">
      Logout
    </button>
  </div>
  <div v-else>
    <h1>Not logged in</h1>

    <fieldset>
      <legend>Register</legend>
      <form
        action="/auth/register"
        method="post"
      >
        <label for="email">email</label>
        <div>
          <input
            id="email"
            type="text"
            name="email"
          >
        </div>
        <label for="password">password</label>
        <br>
        <div>
          <input
            id="password"
            type="password"
            name="password"
          >
        </div>
        <br>
        <div>
          <button>SUBMIT</button>
        </div>
      </form>
    </fieldset>
    <fieldset>
      <legend>Login</legend>
      <form
        action="/auth/login"
        method="post"
      >
        <label for="email">email</label>
        <div>
          <input
            id="email"
            type="text"
            name="email"
          >
        </div>
        <label for="password">password</label>
        <br>
        <div>
          <input
            id="password"
            type="password"
            name="password"
          >
        </div>
        <br>
        <div>
          <button>SUBMIT</button>
        </div>
      </form>
    </fieldset>
    <a href="/auth/github">Login with GitHub</a>
  </div>

  <br>
  <br>
  <br>
  <table border="1">
    <thead>
      <tr>
        <th>ID</th>
        <th>Email</th>
        <th>Password</th>
        <th>Created At</th>
        <th>Updated At</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="row in usersInDb.rows"
        :key="row.id"
      >
        <td>{{ row.id }}</td>
        <td>{{ row.email }}</td>
        <td>{{ row.password?.substring(0, 5) }}...</td>
        <td>{{ row.created_at }}</td>
        <td>{{ row.updated_at }}</td>
      </tr>
    </tbody>
  </table>
</template>
