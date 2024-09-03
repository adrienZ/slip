import type { ConnectorName, Database } from "db0";
import z from "zod";
import consola from "consola";
import { SqliteTableChecker } from "./lib/sqlite-table-checker";

export type supportedConnectors = Extract<ConnectorName, "sqlite" | "libsql">;
const CONNECTOR_NAME = ["sqlite", "libsql"] as const satisfies supportedConnectors[];

const DatabaseSchema = z.object({
  exec: z.function(),
  prepare: z.function(),
  sql: z.function(),
});

const TableNamesSchema = z.object({
  users: z.string().min(1),
  sessions: z.string().min(1),
});

export interface tableNames {
  users: string
  sessions: string
  oauthAccounts: string
}

export function checkDatabaseValidity(
  db: unknown,
  tableNames: unknown,
): Database {
  if (!db) {
    throw new Error("No database to check, please provide one");
  }

  if (!tableNames) {
    throw new Error(
      "No tableNames provided for SlipAuth: { users: string, sessions: string, oauthAccounts: string }",
    );
  }

  const { success: tableNamesSuccess } = TableNamesSchema.safeParse(tableNames);

  if (!tableNamesSuccess) {
    throw new Error(
      "tableNames provided for SlipAuth are incorrect, { users: string, sessions: string }",
    );
  }

  const { data: validatedDatabase, success: databaseValidity }
    = DatabaseSchema.safeParse(db);
  if (!databaseValidity) {
    throw new Error(
      "The provided database is not a valid db0 database, see https://github.com/unjs/db0",
    );
  }

  return validatedDatabase as Database;
}

export async function checkDbAndTables(
  _database: Database,
  connectorType: supportedConnectors,
  tableNames: tableNames,
): Promise<boolean> {
  const database = checkDatabaseValidity(_database, tableNames);

  let tableChecker: SqliteTableChecker;

  switch (connectorType) {
    case "sqlite":
      tableChecker = new SqliteTableChecker(database, tableNames);
      break;
    case "libsql":
      tableChecker = new SqliteTableChecker(database, tableNames);
      break;
    default:
      throw new Error(
        `Invalid enum value. Expected ${CONNECTOR_NAME.map(name => `'${name}'`).join(" | ")}, received '${connectorType}'`,
      );
  }

  const isUserTableOk = await tableChecker.checkUserTable();
  consola.success(`Table "${tableNames.users}" exists and has a valid schema`);

  const isSessionTableOk = await tableChecker.checkSessionTable();
  consola.success(
    `Table "${tableNames.sessions}" exists and has a valid schema`,
  );

  const isOauthTableOk = await tableChecker.checkOauthAccountTable();
  consola.success(
    `Table "${tableNames.oauthAccounts}" exists and has a valid schema`,
  );

  return isUserTableOk && isSessionTableOk && isOauthTableOk;
}
