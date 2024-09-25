import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { getOAuthAccountsTableSchema, getSessionsTableSchema, getUsersTableSchema, getEmailVerificationCodesTableSchema } from "../database/lib/sqlite/schema.sqlite";
import type { tableNames } from "../database/lib/tables";

export type { tableNames };

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
export type SlipAuthSession = SessionsTableSelect;

type UsersTableSelect = ReturnType<typeof getUsersTableSchema>["$inferSelect"];
export type SlipAuthUser = UsersTableSelect;

export type SlipAuthOAuthAccount = ReturnType<typeof getOAuthAccountsTableSchema>["$inferSelect"];

export type EmailVerificationCodeTableInsert = ReturnType<typeof getEmailVerificationCodesTableSchema>["$inferInsert"];
export type SlipAuthEmailVerificationCode = ReturnType<typeof getEmailVerificationCodesTableSchema>["$inferSelect"];

export interface IPasswordHashingMethods {
  hash: (rawPassword: string) => Promise<string>
  verify: (sourceHashedPassword: string, rawPassword: string) => Promise<boolean>
}

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
  emailVerificationCodes: "fakeEmailVerificationCodes",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const schemasMockValue = {
  users: getUsersTableSchema(fakeTableNames),
  sessions: getSessionsTableSchema(fakeTableNames),
  oauthAccounts: getOAuthAccountsTableSchema(fakeTableNames),
  emailVerificationCodes: getEmailVerificationCodesTableSchema(fakeTableNames),
} satisfies Record<keyof tableNames, SQLiteTable>;
export type SchemasMockValue = typeof schemasMockValue;
// #endregion
