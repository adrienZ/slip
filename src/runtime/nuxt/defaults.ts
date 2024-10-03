import type { tableNames } from "../core/types";

export const defaultTableNames: tableNames = {
  sessions: "slip_auth_sessions",
  users: "slip_auth_users",
  oauthAccounts: "slip_auth_oauth_accounts",
  emailVerificationCodes: "slip_auth_email_verification_codes",
  resetPasswordTokens: "slip_auth_reset_password_tokens",
};
