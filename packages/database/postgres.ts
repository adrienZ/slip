import { createDatabase } from "db0";
import postgresql from "db0/connectors/postgresql";

async function main() {
  const db = createDatabase(
    postgresql({
      url: "postgres://adrienzaganelli@localhost:5432/postgres",
    }),
  );
  // Create users table
  await db.sql`CREATE TABLE IF NOT EXISTS users ("id" TEXT PRIMARY KEY, "firstName" TEXT, "lastName" TEXT, "email" TEXT)`;

  const stmt = db.prepare(`
  select column_name, data_type, character_maximum_length, column_default, is_nullable
from INFORMATION_SCHEMA.COLUMNS where table_name = 'users';
    `);

  const tableInfo = await stmt.all();
}

main();
