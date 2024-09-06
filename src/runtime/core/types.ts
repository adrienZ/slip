import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { checkDbAndTables, tableNames } from "../database";
import { getOAuthAccountsTableSchema, getSessionsTableSchema, getUsersTableSchema } from "../database/lib/schema";

export type { tableNames };
export type { supportedConnectors } from "../database";

export type checkDbAndTablesParameters = Parameters<typeof checkDbAndTables>;

interface ISessionCreateMetada {
  ip?: string
  ua?: string
}


export interface ICreateOrLoginParams extends ISessionCreateMetada {
  providerId: string
  providerUserId: string
  // because our slip is based on unique emails
  email: string

}

export interface ICreateSessionsParams extends ISessionCreateMetada {
  userId: string
  expiresAt: number
  ip?: string
  ua?: string
}

export interface ICreateUserParams extends ISessionCreateMetada {
  // because our slip is based on unique emails
  email?: unknown
  password?: unknown
}

export interface ILoginUserParams extends ISessionCreateMetada {
  // because our slip is based on unique emails
  email?: unknown
  password?: unknown
}

type SessionsTableSelect = ReturnType<typeof getSessionsTableSchema>["$inferSelect"];
export interface SlipAuthSession extends SessionsTableSelect {

}

type UsersTableSelect = ReturnType<typeof getUsersTableSchema>["$inferSelect"];
export interface SlipAuthUser extends UsersTableSelect {}

export type OAuthAccountsTableSelect = ReturnType<typeof getOAuthAccountsTableSchema>["$inferSelect"];
export interface SlipAuthOAuthAccount extends OAuthAccountsTableSelect {}

export interface ISlipAuthCoreOptions {
  /**
   * {@link https://github.com/unjs/h3/blob/c04c458810e34eb15c1647e1369e7d7ef19f567d/src/utils/session.ts#L24}
   */
  sessionMaxAge: number
}

// #region schemas typings
const fakeTableNames: tableNames = {
  users: "fakeUsers",
  sessions: "fakeSessions",
  oauthAccounts: "fakeOauthAccounts",
};

const schemasMockValue = {
  users: getUsersTableSchema(fakeTableNames),
  sessions: getSessionsTableSchema(fakeTableNames),
  oauthAccounts: getOAuthAccountsTableSchema(fakeTableNames),
} satisfies Record<keyof tableNames, SQLiteTable>;
export type SchemasMockValue = typeof schemasMockValue;
// #endregion
