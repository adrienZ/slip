import { ConnectorName, Database  } from "db0";
import z from "zod"
import consola from "consola";
import { SqliteTableChecker } from "./lib/sqlite-table-checker";

type supportedConnectors = Extract<ConnectorName, "sqlite">
const CONNECTOR_NAME = ["sqlite"] as const satisfies supportedConnectors[]

const DatabaseSchema = z.object({
  exec: z.function(),
  prepare: z.function(),
  sql: z.function(),
})


export function checkDatabaseValidity(db: unknown): Database {
  if (!db) {
    throw new Error("No database to check, please provide one")
  }

  const { data: validatedDatabase, success: databaseValidity, error } = DatabaseSchema.safeParse(db);
  if (!databaseValidity) {
    throw new Error(`The provided database is not a valid db0 database, see https://github.com/unjs/db0`);
  }

  return validatedDatabase as Database;
}

export async function checkDbAndTables(_database: Database, connectorType: supportedConnectors): Promise<Database> {
  const database = checkDatabaseValidity(_database);

  let tableChecker: SqliteTableChecker

  switch (connectorType) {
    case "sqlite":
      tableChecker = new SqliteTableChecker(database);
      break;
    default:
      throw new Error(`Invalid enum value. Expected ${CONNECTOR_NAME.map(name => `'${name}'`).join(` | `)}, received '${connectorType}'`)
  }

  const isUserTableOk = await tableChecker.checkUserTable("users")
  consola.success(`Table "users" exists and has a valid schema`);

  // const isSessionTableOk = await tableChecker.checkUserTable("sessions")
  // consola.success(`Table "sessions" exists and has a valid schema`);

  return database
}