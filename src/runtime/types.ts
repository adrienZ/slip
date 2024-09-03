import type { SlipAuthSession, SlipAuthUser, supportedConnectors, tableNames, ISlipAuthCoreOptions } from "./core/types";
import type { useSession } from "h3";

export type SessionConfig = Parameters<typeof useSession>[1];

export interface SlipModuleOptions extends ISlipAuthCoreOptions {
  /**
   * db0 related options
   */
  database: {
    /**
     * {@link https://db0.unjs.io/connectors}
     */
    dialect: supportedConnectors
    /**
     * {@link https://nitro.unjs.io/guide/database#configuration}
     */
    nitroDatabaseName: string
  }

  tableNames: tableNames
}

declare module "nuxt/schema" {
  interface RuntimeConfig {
    slipAuth: SlipModuleOptions
    slipAuthIpInfoToken?: string
  }
}

export interface SlipAuthPublicSession extends Pick<SlipAuthSession, "id" | "expires_at"> {}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore #auth-utils is an alias from nuxt-auth-utils
declare module "#auth-utils" {

  interface UserSession extends SlipAuthPublicSession {}
  interface User extends Pick<SlipAuthUser, "id"> {}
}
