import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import type { tableNames } from "../../core/types";
import { sql } from "drizzle-orm";

const datesColumns = {
  created_at: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const getUsersTableSchema = (tableNames: tableNames) => sqliteTable(tableNames.users, {
  id: text("id").primaryKey().notNull(),
  password: text("password"),
  email: text("email").notNull().unique(),
  email_verified: integer("email_verified", { mode: "boolean" }).default(sql`FALSE`),
  ...datesColumns,
});

export const getSessionsTableSchema = (tableNames: tableNames) => sqliteTable(tableNames.sessions, {
  id: text("id").primaryKey().notNull(),
  expires_at: integer("expires_at").notNull(),
  ip: text("ip"),
  ua: text("ua"),
  user_id: text("user_id")
    .references(() => getUsersTableSchema(tableNames).id)
    .notNull(),
  ...datesColumns,
});

// https://lucia-auth.com/guides/oauth/multiple-providers
export const getOAuthAccountsTableSchema = (tableNames: tableNames) => sqliteTable(tableNames.oauthAccounts, {
  provider_id: text("provider_id").notNull(),
  provider_user_id: text("provider_user_id").notNull(),
  user_id: text("user_id")
    .references(() => getUsersTableSchema(tableNames).id)
    .notNull(),
  ...datesColumns,
}, slipAuthOAuthAccounts => ({
  pk: primaryKey(slipAuthOAuthAccounts.provider_id, slipAuthOAuthAccounts.provider_user_id),
}));

// https://lucia-auth.com/guides/email-and-password/email-verification-codes
export const getEmailVerificationCodesTableSchema = (tableNames: tableNames) => sqliteTable(tableNames.emailVerificationCodes, {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
  code: text("code", { length: 6 }).notNull(),
  email: text("email").notNull(),
  user_id: text("user_id").unique()
    .references(() => getUsersTableSchema(tableNames).id)
    .notNull(),
  expires_at: integer("expires_at", { mode: "timestamp" }).notNull(),
  ...datesColumns,
});

export const getPasswordResetTokensTableSchema = (tableNames: tableNames) => sqliteTable(tableNames.resetPasswordTokens, {
  token_hash: text("token_hash").primaryKey().notNull(),
  user_id: text("user_id").unique()
    .references(() => getUsersTableSchema(tableNames).id)
    .notNull(),
  expires_at: integer("expires_at", { mode: "timestamp" }).notNull(),
  ...datesColumns,
});
