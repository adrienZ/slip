export default defineEventHandler(async () => {
  const config = useRuntimeConfig().slipAuth;
  const db = useDatabase(config.database.nitroDatabaseName);
  const users = await db.sql`SELECT * from slip_auth_users`;

  return users;
});
