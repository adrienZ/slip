import type { SlipAuthSession, supportedConnectors, tableNames } from "./core/core";

export interface SlipModuleOptions {
  /**
   * {@link https://db0.unjs.io/connectors}
   */
  dialect: supportedConnectors
  tableNames: tableNames
  /**
   * {@link https://github.com/unjs/h3/blob/c04c458810e34eb15c1647e1369e7d7ef19f567d/src/utils/session.ts#L24}
   */
  sessionMaxAge: number
  /**
   * {@link https://nitro.unjs.io/guide/database#configuration}
   */
  nitroDatabaseName?: string
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
