import { Connector, ConnectorName, createDatabase, Database  } from "db0";
import z from "zod"
import consola from "consola";
import { SqliteTableChecker } from "./lib/sqlite-table-checker";

type supportedConnectors = Extract<ConnectorName, "sqlite" | "postgresql">
export const CONNECTOR_NAME = ["sqlite", "postgresql"] as const satisfies supportedConnectors[]

const ConnectorSchema = z.object({
  exec: z.function(),
  prepare: z.function(),
  name: z.enum(CONNECTOR_NAME)
})

export async function checkAndCreateDb(userDatabase: unknown | Connector): Promise<Database> {
  consola.info(`initializing database checks`);

  const validatedConnector = ConnectorSchema.parse(userDatabase) as Connector
  consola.success(`Database connector: ${validatedConnector.name}`)

  const database = createDatabase(validatedConnector);

  let tableChecker: SqliteTableChecker

  switch (validatedConnector.name) {
    case "sqlite":
      tableChecker = new SqliteTableChecker(database);
      break;
    default:
      throw Error("could process database connector")
  }
  

  const isUserTableOk = await tableChecker.checkUserTable("users")
  consola.success(`Table "users" exists and has a valid schema`)

  return database
}