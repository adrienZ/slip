export default defineEventHandler(async () => {
  const db = useDatabase();
  await db.sql`CREATE TABLE IF NOT EXISTS test ("id" TEXT)`;
  const tableInfos = await db.prepare("PRAGMA table_info(test)").get();

  return tableInfos;
});
