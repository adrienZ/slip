import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import type { tableNames } from "..";

export const getUsersTableSchema = (tableNames: tableNames) => sqliteTable(tableNames.users, {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull(),
});

export const getSessionsTableSchema = (tableNames: tableNames) => sqliteTable(tableNames.users, {
  id: text("id").primaryKey().notNull(),
  expires_at: integer("expires_at").notNull(),
  user_id: text("user_id")
    .references(() => getUsersTableSchema(tableNames).id)
    .notNull(),
});

export const getOAuthAccountsTableSchema = (tableNames: tableNames) => sqliteTable("slip_auth_oauth_accounts", {
  provider_id: text("provider_id").notNull(),
  provider_user_id: text("provider_user_id").notNull(),
  user_id: text("user_id")
    .references(() => getUsersTableSchema(tableNames).id)
    .notNull(),
}, slipAuthOAuthAccounts => ({
  pk: primaryKey(slipAuthOAuthAccounts.provider_id, slipAuthOAuthAccounts.provider_user_id),
}));
