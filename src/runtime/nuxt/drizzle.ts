import { SlipAuthCore } from "../core/core";
import type { tableNames } from "../core/types";
import { defaultTableNames } from "./defaults";

export function getNuxtSlipAuthSchemas(tableNames: tableNames = defaultTableNames) {
  // @ts-expect-error temp instance with no db
  const tempAuthInstance = new SlipAuthCore({}, tableNames, {});
  return tempAuthInstance.schemas;
};
