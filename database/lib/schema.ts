import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("slip_auth_users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull(),
});

export const sessionsTable = sqliteTable("slip_auth_sessions", {
  id: text("id").primaryKey().notNull(),
  expires_at: integer("expires_at").notNull(),
  user_id: text("user_id")
    .references(() => usersTable.id)
    .notNull(),
});

export const oAuthAccountsTable = sqliteTable("slip_auth_oauth_accounts", {
  provider_id: text("provider_id").notNull(),
  provider_user_id: text("provider_user_id").notNull(),
  user_id: text("user_id")
    .references(() => usersTable.id)
    .notNull(),
}, slipAuthOAuthAccounts => ({
  pk: primaryKey(slipAuthOAuthAccounts.provider_id, slipAuthOAuthAccounts.provider_user_id),
}));
