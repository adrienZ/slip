import { checkDbAndTables, type tableNames } from "@slip/database";
import type { Database } from "db0";

type checkDbAndTablesParameters = Parameters<typeof checkDbAndTables>;

export class SlipAuth {
  constructor(
    providedDatase: checkDbAndTablesParameters[0],
    dialect: checkDbAndTablesParameters[1],
    tableNames: tableNames
  ) {
    checkDbAndTables(providedDatase, dialect, tableNames);
  }
}
