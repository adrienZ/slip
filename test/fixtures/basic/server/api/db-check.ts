// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

export default defineEventHandler(async () => {
  // @ts-expect-error experimental typing is not working with test utils
  const db = useDatabase();
  await db.sql`CREATE TABLE IF NOT EXISTS test ("id" TEXT)`;
  const tableInfos = await db.prepare("PRAGMA table_info(test)").get();

  return tableInfos;
});
