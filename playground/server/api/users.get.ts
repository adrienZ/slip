function isSqliteD1<T extends Array<unknown>>(sqlResult: T | undefined | { results: T, success: true, meta: object }): sqlResult is { results: T, success: true, meta: object } {
  if (typeof sqlResult === "undefined") {
    return false;
  }

  if (Array.isArray(sqlResult)) {
    return false;
  }

  if (
    sqlResult.success === true
    && typeof sqlResult.meta === "object"
    && Array.isArray(sqlResult.results)
  ) {
    return true;
  }

  return false;
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig().slipAuth;
  const db = useDatabase(config.database.nitroDatabaseName);
  const users = await db.sql`SELECT id, email, created_at, email_verified from slip_auth_users`;

  if (isSqliteD1(users.rows)) {
    return users.rows.results;
  }

  return users.rows;
});
