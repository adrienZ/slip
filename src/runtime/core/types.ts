import type { checkDbAndTables, tableNames } from "../database";
import type { getOAuthAccountsTableSchema, getSessionsTableSchema, getUsersTableSchema } from "../database/lib/schema";

export type { tableNames };
export type { supportedConnectors } from "../database";

export type checkDbAndTablesParameters = Parameters<typeof checkDbAndTables>;

export interface ICreateOrLoginParams {
  providerId: string
  providerUserId: string
  // because our slip is based on unique emails
  email: string
  ip?: string
  ua?: string
}

export interface ICreateSessionsParams {
  userId: string
  expiresAt: number
  ip?: string
  ua?: string
}

type SessionsTableSelect = ReturnType<typeof getSessionsTableSchema>["$inferSelect"];
export interface SlipAuthSession extends Pick<SessionsTableSelect, "id" | "expires_at"> {

}

type UsersTableSelect = ReturnType<typeof getUsersTableSchema>["$inferSelect"];
export interface SlipAuthUser extends Pick<UsersTableSelect, "id"> {}

export type OAuthAccountsTableSelect = ReturnType<typeof getOAuthAccountsTableSchema>["$inferSelect"];

export interface ISlipAuthCoreOptions {
  sessionMaxAge: number
}
