import type { SlipAuthSession, supportedConnectors, tableNames } from "./core/core";

export interface SlipModuleOptions {
  dialect: supportedConnectors
  tableNames: tableNames
  sessionMaxAge: number
}

declare module "nuxt/schema" {
  interface RuntimeConfig {
    slipAuth: SlipModuleOptions
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore #auth-utils is an alias from nuxt-auth-utils
declare module "#auth-utils" {

  interface UserSession extends Pick<SlipAuthSession, "id" | "expires_at"> {}
}
