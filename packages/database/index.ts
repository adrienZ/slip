import { Connector, ConnectorName, createDatabase, Database  } from "db0";
import z from "zod"
import consola from "consola";
import { SqliteTableChecker } from "./lib/sqlite-table-checker";

type supportedConnectors = Extract<ConnectorName, "sqlite" | "postgresql">
const CONNECTOR_NAME = ["sqlite", "postgresql"] as const satisfies supportedConnectors[]

const ConnectorSchema = z.object({
  exec: z.function(),
  prepare: z.function(),
  name: z.enum(CONNECTOR_NAME)
})

export async function checkAndCreateDb(userDatabase: unknown): Promise<Database> {
  if (!userDatabase) {
    throw new Error("No database connector to check, please provide one")
  }

  const { data: validatedConnector, success: connectorValidity, error: connectorError } = ConnectorSchema.safeParse(userDatabase);
  if (!connectorValidity) {
    throw new Error(connectorError.message);
  }

  const database = createDatabase(validatedConnector as Connector);
  let tableChecker: SqliteTableChecker

  switch (validatedConnector.name) {
    case "sqlite":
      tableChecker = new SqliteTableChecker(database);
      break;
    default:
      throw Error("could process database connector")
  }


  const isUserTableOk = await tableChecker.checkUserTable("users")
  consola.success(`Table "users" exists and has a valid schema`);

  const isSessionTableOk = await tableChecker.checkUserTable("sessions")
  consola.success(`Table "sessions" exists and has a valid schema`);

  return database
}