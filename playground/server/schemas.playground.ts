// replace by "nuxt-slip-auth/nuxt-drizzle";
import { getNuxtSlipAuthSchemas } from "../../dist/runtime/nuxt/drizzle";

export const {
  users,
  emailVerificationCodes,
  oauthAccounts,
  resetPasswordTokens,
  sessions,
} = getNuxtSlipAuthSchemas();
