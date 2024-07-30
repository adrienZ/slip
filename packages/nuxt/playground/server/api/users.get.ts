export default defineEventHandler(async () => {
  const db = useDatabase();
  const users = await db.sql`SELECT * from slip_auth_users`;

  return users;
});
