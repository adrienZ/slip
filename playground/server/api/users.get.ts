export default defineEventHandler(async () => {
  const config = useRuntimeConfig().slipAuth;
  const db = useDatabase(config.database.nitroDatabaseName);
  const users = await db.sql`SELECT id, email, created_at, updated_at, email_verified from slip_auth_users`;

  return users;
});
