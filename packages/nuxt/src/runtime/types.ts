import type { supportedConnectors, tableNames } from "@slip/core";

export interface SlipModuleOptions {
  dialect: supportedConnectors
  tableNames: tableNames
}
