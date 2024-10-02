// replace "../../" by "nuxt-slip-auth"
import { getNuxtSlipAuthSchemas } from "../../dist/runtime/nuxt/drizzle";

export const {
  users,
  emailVerificationCodes,
  oauthAccounts,
  resetPasswordTokens,
  sessions,
} = getNuxtSlipAuthSchemas();
