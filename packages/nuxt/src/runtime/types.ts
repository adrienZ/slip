import type { SlipAuthSession, supportedConnectors, tableNames } from "@slip/core";

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

// @ts-expect-error #auth-utils is an alias from nuxt-auth-utils
declare module "#auth-utils" {

  interface UserSession extends SlipAuthSession {}
}
