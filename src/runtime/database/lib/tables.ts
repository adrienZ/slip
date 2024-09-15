import type { ConnectorName } from "db0";

export type supportedConnectors = Extract<ConnectorName, "sqlite" | "libsql" | "bun-sqlite">;

export const CONNECTOR_NAME = ["sqlite", "libsql", "bun-sqlite"] as const satisfies supportedConnectors[];

export interface tableNames {
  users: string
  sessions: string
  oauthAccounts: string
}
